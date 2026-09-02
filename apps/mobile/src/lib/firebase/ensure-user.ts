import { authApi } from '@/lib/api';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { onAuthStateChanged, signInWithCustomToken, type User } from 'firebase/auth';

async function waitForFirebaseUser(timeoutMs: number): Promise<User> {
  const auth = getFirebaseAuth();
  if (auth.currentUser) {
    return auth.currentUser;
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      unsubscribe();
      reject(new Error('Firebase sign-in is not ready'));
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      clearTimeout(timer);
      unsubscribe();
      resolve(user);
    });
  });
}

export async function ensureFirebaseUserForUpload(): Promise<User> {
  const auth = getFirebaseAuth();
  if (auth.currentUser) {
    return auth.currentUser;
  }

  try {
    return await waitForFirebaseUser(1000);
  } catch {
    const { customToken } = await authApi.getFirebaseCustomToken();
    const credential = await signInWithCustomToken(auth, customToken);
    return credential.user;
  }
}
