import { db, auth } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { CarouselProject } from '../types';

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
  createdAt: any;
  updatedAt: any;
}

const COLLECTION_NAME = 'projects';

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
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(error instanceof Error ? error.message : JSON.stringify(errInfo));
}

/**
 * Saves a project.
 * If existingId is provided and the document exists, it updates that exact document so NO duplicates are created.
 * Accessible to all team members so any user can edit and save changes.
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

  const updatePayload: Record<string, any> = {
    title,
    data: JSON.stringify({ ...project, title }),
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
    let updatedDataString = currentData?.data;
    try {
      if (updatedDataString) {
        const parsed = JSON.parse(updatedDataString);
        parsed.title = trimmed;
        updatedDataString = JSON.stringify(parsed);
      }
    } catch {
      // ignore json parse error
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
 * Ordered by most recently updated.
 */
export const getProjects = async (_userId?: string): Promise<SavedProject[]> => {
  try {
    // All authenticated users can see and edit all projects in the shared workspace
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const projects: SavedProject[] = [];
    querySnapshot.forEach((d) => {
      const data = d.data();
      projects.push({
        id: d.id,
        ...data,
        status: (data.status as ProjectStatus) || 'in_progress',
      } as SavedProject);
    });
    return projects;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
};

/**
 * Deletes a project by ID.
 */
export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, projectId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${projectId}`);
  }
};

/**
 * Duplicates a project as a new document.
 */
export const duplicateProject = async (
  userId: string,
  projectDataJson: string,
  currentTitle: string,
  userInfo?: { email?: string | null; displayName?: string | null }
): Promise<string> => {
  try {
    let parsed: CarouselProject;
    try {
      parsed = JSON.parse(projectDataJson);
    } catch {
      throw new Error('Ugyldig prosjektdata');
    }
    const copyTitle = `${currentTitle || 'Utkast'} (kopi)`;
    parsed.title = copyTitle;
    const currentUser = auth.currentUser;
    const userEmail = userInfo?.email || currentUser?.email || '';
    const userName = userInfo?.displayName || currentUser?.displayName || userEmail.split('@')[0] || '';

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      userId,
      creatorEmail: userEmail,
      creatorName: userName,
      lastUpdatedByEmail: userEmail,
      lastUpdatedByName: userName,
      title: copyTitle,
      data: JSON.stringify(parsed),
      status: 'in_progress',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
    throw error;
  }
};

