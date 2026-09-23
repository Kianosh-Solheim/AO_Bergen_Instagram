import { db, auth } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { User } from 'firebase/auth';

export const ADMIN_EMAIL = 'kianoshsolheim@gmail.com';

export const isUserAdmin = (email?: string | null): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
};

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  createdAt?: any;
  lastLoginAt?: any;
}

const USERS_COLLECTION = 'users';

/**
 * Synchronizes user authentication details into the Firestore 'users' collection.
 * Runs upon login so admins can see all registered accounts.
 */
export const syncUserProfile = async (user: User): Promise<void> => {
  if (!user || !user.uid) return;

  try {
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    const docSnap = await getDoc(userRef);

    const now = serverTimestamp();
    const dataToSet: Record<string, any> = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Bruker',
      photoURL: user.photoURL || null,
      lastLoginAt: now,
    };

    if (!docSnap.exists()) {
      dataToSet.createdAt = now;
      await setDoc(userRef, dataToSet);
    } else {
      await setDoc(userRef, dataToSet, { merge: true });
    }
  } catch (error) {
    console.warn('Kunne ikke synkronisere brukerprofil til Firestore:', error);
  }
};

/**
 * Retrieves all registered users from Firestore.
 * Intended for the admin user (kianoshsolheim@gmail.com).
 */
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    const users: UserProfile[] = [];
    querySnapshot.forEach((d) => {
      users.push({ ...d.data() } as UserProfile);
    });
    // Sort in memory by lastLoginAt or createdAt descending
    users.sort((a, b) => {
      const timeA = a.lastLoginAt?.toMillis ? a.lastLoginAt.toMillis() : (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
      const timeB = b.lastLoginAt?.toMillis ? b.lastLoginAt.toMillis() : (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
      return timeB - timeA;
    });
    return users;
  } catch (error) {
    console.error('Feil ved henting av brukere:', error);
    return [];
  }
};
