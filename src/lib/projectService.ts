import { db } from './firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, orderBy, serverTimestamp } from 'firebase/firestore';
import { CarouselProject } from '../types';

export interface SavedProject {
  id: string;
  userId: string;
  title: string;
  data: string; // JSON string of CarouselProject
  status: 'draft' | 'published';
  createdAt: any;
  updatedAt: any;
}

const COLLECTION_NAME = 'projects';

export const saveProject = async (userId: string, project: CarouselProject, status: 'draft' | 'published' = 'draft', existingId?: string) => {
  const projectData = {
    userId,
    title: project.title || 'Uten tittel',
    data: JSON.stringify(project),
    status,
    updatedAt: serverTimestamp(),
  };

  if (existingId) {
    const docRef = doc(db, COLLECTION_NAME, existingId);
    await updateDoc(docRef, projectData);
    return existingId;
  } else {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...projectData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }
};

export const getProjects = async (userId: string) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  const projects: SavedProject[] = [];
  querySnapshot.forEach((doc) => {
    projects.push({ id: doc.id, ...doc.data() } as SavedProject);
  });
  return projects;
};

export const deleteProject = async (projectId: string) => {
  await deleteDoc(doc(db, COLLECTION_NAME, projectId));
};
