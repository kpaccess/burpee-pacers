import { db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { UserData } from '../types';

/**
 * Subscribes to real-time updates for a user's document, so changes made
 * from other devices (e.g. the iOS/Android apps) are reflected on web
 * without requiring a page reload. Returns an unsubscribe function.
 */
export const subscribeToUserData = (
  userId: string,
  onData: (data: UserData | null) => void,
  onError: (error: unknown) => void,
): (() => void) => {
  if (!db) {
    onData(null);
    return () => {};
  }
  const docRef = doc(db, 'users', userId);
  return onSnapshot(
    docRef,
    (docSnap) => onData(docSnap.exists() ? (docSnap.data() as UserData) : null),
    onError,
  );
};

export const saveUserDataDB = async (userId: string, data: Partial<UserData>) => {
  if (!db) return;
  const docRef = doc(db, 'users', userId);
  await setDoc(docRef, data, { merge: true });
};
