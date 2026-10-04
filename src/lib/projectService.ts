import { db, auth } from './firebase';
import {
  collection,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  getDocs,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { CarouselProject } from '../types';
import { optimizeProjectImagesForStorage } from './imageUtils';

export type ProjectStatus =
  | 'not_started'
  | 'in_progress'
  | 'ready_for_publishing'
  | 'published'
  | 'draft';

export interface StatusMeta {
  key: ProjectStatus;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  description: string;
}

export const PROJECT_STATUSES: Record<ProjectStatus, StatusMeta> = {
  not_started: {
    key: 'not_started',
    label: 'Ikke påbegynt',
    badgeBg: 'bg-stone-100',
    badgeText: 'text-stone-700',
    badgeBorder: 'border-stone-300',
    dotColor: 'bg-stone-400',
    description: 'Innlegget er opprettet, men ikke påbegynt',
  },
  in_progress: {
    key: 'in_progress',
    label: 'Jobbes med',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    dotColor: 'bg-blue-500',
    description: 'Innhold og design er under arbeid',
  },
  ready_for_publishing: {
    key: 'ready_for_publishing',
    label: 'Klar for publisering',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-300',
    dotColor: 'bg-amber-500',
    description: 'Kvalitetssikret og klar til å postes',
  },
  published: {
    key: 'published',
    label: 'Publisert',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-300',
    dotColor: 'bg-emerald-500',
    description: 'Delt og publisert på Instagram',
  },
  draft: {
    key: 'draft',
    label: 'Utkast',
    badgeBg: 'bg-stone-100',
    badgeText: 'text-stone-700',
    badgeBorder: 'border-stone-300',
    dotColor: 'bg-stone-400',
    description: 'Generelt utkast',
  },
};

export interface SavedProject {
  id: string;
  userId: string;
  creatorEmail?: string;
  creatorName?: string;
  lastUpdatedByEmail?: string;
  lastUpdatedByName?: string;
  title: string;
  data: string; // JSON string of CarouselProject
  status: ProjectStatus;
  isChunked?: boolean;
  chunkCount?: number;
  slideCount?: number;
  uploadedImagesCount?: number;
  createdAt: any;
  updatedAt: any;
}

const COLLECTION_NAME = 'projects';
const CHUNK_SUBCOLLECTION = 'chunks';
const MAX_INLINE_CHARS = 700_000; // ~700 KB safe inline threshold (Firestore limit is 1,048,576 bytes)
const CHUNK_SIZE_CHARS = 600_000;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function splitStringIntoChunks(str: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += chunkSize) {
    chunks.push(str.slice(i, i + chunkSize));
  }
  return chunks;
}

async function syncExtraChunks(projectId: string, extraChunks: string[]): Promise<void> {
  const chunksColRef = collection(db, COLLECTION_NAME, projectId, CHUNK_SUBCOLLECTION);

  // Write any extra chunks (index 1..N)
  for (let i = 0; i < extraChunks.length; i++) {
    const chunkIndex = i + 1;
    const chunkDocRef = doc(db, COLLECTION_NAME, projectId, CHUNK_SUBCOLLECTION, `chunk_${chunkIndex}`);
    await setDoc(chunkDocRef, {
      index: chunkIndex,
      data: extraChunks[i],
      updatedAt: serverTimestamp(),
    });
  }

  // Clean up any stale chunks from previous saves if chunk count decreased
  try {
    const existingSnap = await getDocs(chunksColRef);
    const staleDeletes: Promise<void>[] = [];
    existingSnap.forEach((docSnap) => {
      const idx = docSnap.data()?.index;
      if (typeof idx === 'number' && idx > extraChunks.length) {
        staleDeletes.push(deleteDoc(docSnap.ref));
      }
    });
    if (staleDeletes.length > 0) {
      await Promise.all(staleDeletes);
    }
  } catch {
    // Ignore cleanup errors
  }
}

async function reassembleChunkedData(projectId: string, firstChunk: string): Promise<string> {
  try {
    const chunksColRef = collection(db, COLLECTION_NAME, projectId, CHUNK_SUBCOLLECTION);
    const snap = await getDocs(chunksColRef);
    if (snap.empty) return firstChunk;

    const sortedChunks: { index: number; data: string }[] = [];
    snap.forEach((d) => {
      const dData = d.data();
      if (typeof dData.index === 'number' && typeof dData.data === 'string') {
        sortedChunks.push({ index: dData.index, data: dData.data });
      }
    });
    sortedChunks.sort((a, b) => a.index - b.index);
    return firstChunk + sortedChunks.map((c) => c.data).join('');
  } catch (err) {
    console.warn(`Kunne ikke hente ekstra bilde-chunks for prosjekt ${projectId}:`, err);
    return firstChunk;
  }
}

/**
 * Saves a project (including any images uploaded from the user's computer).
 * Automatically optimizes base64 images and chunks oversized payloads so Firestore's 1 MiB limit is never exceeded.
 */
export const saveProject = async (
  userId: string,
  project: CarouselProject,
  status: ProjectStatus = 'in_progress',
  existingId?: string,
  userInfo?: { email?: string | null; displayName?: string | null }
): Promise<string> => {
  const title = (project.title || '').trim() || 'Uten tittel';
  const currentUser = auth.currentUser;
  const userEmail = userInfo?.email || currentUser?.email || '';
  const userName = userInfo?.displayName || currentUser?.displayName || userEmail.split('@')[0] || '';

  // Optimize any computer-uploaded base64 images so they are fast and compact
  const optimizedProject = await optimizeProjectImagesForStorage({
    ...project,
    title,
  });

  let uploadedImagesCount = 0;
  for (const s of optimizedProject.slides || []) {
    for (const img of s.images || []) {
      if (img?.url && img.url.startsWith('data:image/')) {
        uploadedImagesCount++;
      }
    }
  }

  const fullSerialized = JSON.stringify(optimizedProject);
  const needsChunking = fullSerialized.length > MAX_INLINE_CHARS;
  const chunks = needsChunking ? splitStringIntoChunks(fullSerialized, CHUNK_SIZE_CHARS) : [fullSerialized];

  const updatePayload: Record<string, any> = {
    title,
    data: chunks[0],
    isChunked: needsChunking,
    chunkCount: chunks.length,
    slideCount: optimizedProject.slides?.length || 0,
    uploadedImagesCount,
    status,
    lastUpdatedByEmail: userEmail,
    lastUpdatedByName: userName,
    updatedAt: serverTimestamp(),
  };

  if (existingId) {
    const docRef = doc(db, COLLECTION_NAME, existingId);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, updatePayload);
        await syncExtraChunks(existingId, chunks.slice(1));
        return existingId;
      }
    } catch (err) {
      console.warn('Existing document check/update failed, falling back to new doc:', err);
    }
  }

  // Create new document if no existingId or previous doc was deleted
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...updatePayload,
      userId,
      creatorEmail: userEmail,
      creatorName: userName,
      createdAt: serverTimestamp(),
    });
    if (chunks.length > 1) {
      await syncExtraChunks(docRef.id, chunks.slice(1));
    }
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
    throw error;
  }
};

/**
 * Updates the status of an existing project (e.g. from the Library or Editor).
 */
export const updateProjectStatus = async (
  projectId: string,
  newStatus: ProjectStatus,
  userInfo?: { email?: string | null; displayName?: string | null }
): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, projectId);
  const currentUser = auth.currentUser;
  const userEmail = userInfo?.email || currentUser?.email || '';
  const userName = userInfo?.displayName || currentUser?.displayName || userEmail.split('@')[0] || '';

  try {
    await updateDoc(docRef, {
      status: newStatus,
      lastUpdatedByEmail: userEmail,
      lastUpdatedByName: userName,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${projectId}`);
  }
};

/**
 * Renames a saved project by updating its title.
 */
export const renameProject = async (projectId: string, newTitle: string): Promise<void> => {
  const trimmed = newTitle.trim() || 'Uten tittel';
  const docRef = doc(db, COLLECTION_NAME, projectId);
  const currentUser = auth.currentUser;

  try {
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Prosjektet ble ikke funnet');
    }
    const currentData = docSnap.data();
    const isChunked = Boolean(currentData?.isChunked);
    let updatedDataString = currentData?.data;

    if (!isChunked) {
      try {
        if (updatedDataString) {
          const parsed = JSON.parse(updatedDataString);
          parsed.title = trimmed;
          updatedDataString = JSON.stringify(parsed);
        }
      } catch {
        // ignore json parse error
      }
    }

    await updateDoc(docRef, {
      title: trimmed,
      data: updatedDataString || currentData?.data,
      lastUpdatedByEmail: currentUser?.email || currentData?.lastUpdatedByEmail || '',
      lastUpdatedByName: currentUser?.displayName || currentData?.lastUpdatedByName || '',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${projectId}`);
  }
};

/**
 * Fetches all saved projects across the whole workspace so all logged in users can see and collaborate on them.
 * Automatically reassembles any chunked projects that contain multiple computer-uploaded images.
 */
export const getProjects = async (_userId?: string): Promise<SavedProject[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const rawDocs = querySnapshot.docs;

    const projects: SavedProject[] = await Promise.all(
      rawDocs.map(async (d) => {
        const data = d.data();
        let fullDataStr: string = data.data || '';
        if (data.isChunked && (data.chunkCount || 1) > 1) {
          fullDataStr = await reassembleChunkedData(d.id, fullDataStr);
        }
        return {
          id: d.id,
          ...data,
          data: fullDataStr,
          status: (data.status as ProjectStatus) || 'in_progress',
        } as SavedProject;
      })
    );
    return projects;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
};

/**
 * Deletes a project by ID (and any associated image chunks).
 */
export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    try {
      const chunksColRef = collection(db, COLLECTION_NAME, projectId, CHUNK_SUBCOLLECTION);
      const snap = await getDocs(chunksColRef);
      if (!snap.empty) {
        await Promise.all(snap.docs.map((cDoc) => deleteDoc(cDoc.ref)));
      }
    } catch {
      // Ignore chunk delete errors
    }
    await deleteDoc(doc(db, COLLECTION_NAME, projectId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${projectId}`);
  }
};

/**
 * Duplicates a project as a new document (supports projects with uploaded images).
 */
export const duplicateProject = async (
  userId: string,
  projectDataJson: string,
  currentTitle: string,
  userInfo?: { email?: string | null; displayName?: string | null }
): Promise<string> => {
  let parsed: CarouselProject;
  try {
    parsed = JSON.parse(projectDataJson);
  } catch {
    throw new Error('Ugyldig prosjektdata');
  }
  const copyTitle = `${currentTitle || 'Utkast'} (kopi)`;
  parsed.title = copyTitle;

  return saveProject(userId, parsed, 'in_progress', undefined, userInfo);
};

