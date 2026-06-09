import { onAuthStateChanged, type User } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/client';

export async function waitForFirebaseUser(timeoutMs = 8000): Promise<User> {
  const auth = getFirebaseAuth();
  if (auth.currentUser) {
    return auth.currentUser;
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      unsubscribe();
      reject(new Error('Firebase sign-in is not ready. Please try again.'));
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      clearTimeout(timer);
      unsubscribe();
      resolve(user);
    });
  });
}
