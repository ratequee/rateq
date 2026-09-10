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

/**
 * Ensure a Firebase Auth user is present for phone verification / Storage.
 * Prefer the existing JS Auth session; otherwise mint a custom token from the
 * RateQ API (same UID) so a valid JWT session can restore Firebase after app restarts.
 */
export async function ensureFirebaseUser(): Promise<User> {
  const auth = getFirebaseAuth();

  if (auth.currentUser) {
    await auth.currentUser.getIdToken(true);
    return auth.currentUser;
  }

  try {
    const restored = await waitForFirebaseUser(2500);
    await restored.getIdToken(true);
    return restored;
  } catch {
    // Fall through to custom token
  }

  const { customToken } = await authApi.getFirebaseCustomToken();
  const credential = await signInWithCustomToken(auth, customToken);
  await credential.user.getIdToken(true);
  return credential.user;
}

/** @deprecated Prefer `ensureFirebaseUser` — same behavior. */
export async function ensureFirebaseUserForUpload(): Promise<User> {
  return ensureFirebaseUser();
}
