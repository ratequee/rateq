import { FirebaseError } from 'firebase/app';
import {
  GoogleAuthProvider,
  OAuthProvider,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  signInWithEmailAndPassword,
  type AuthCredential,
  type UserCredential,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { AccountLinkingRequiredError } from '@/lib/auth-flow-errors';

export interface AccountExistsConflict {
  email: string;
  pendingCredential: AuthCredential;
}

export function getAccountExistsConflict(error: unknown): AccountExistsConflict | null {
  if (!(error instanceof FirebaseError)) {
    return null;
  }

  if (error.code !== 'auth/account-exists-with-different-credential') {
    return null;
  }

  const email = typeof error.customData?.email === 'string' ? error.customData.email : null;
  if (!email) {
    return null;
  }

  const pendingCredential =
    GoogleAuthProvider.credentialFromError(error) ?? OAuthProvider.credentialFromError(error);

  if (!pendingCredential) {
    return null;
  }

  return { email, pendingCredential };
}

export async function fetchEmailSignInMethods(email: string): Promise<string[]> {
  return fetchSignInMethodsForEmail(getFirebaseAuth(), email.toLowerCase());
}

export async function linkPendingCredentialWithPassword(
  email: string,
  password: string,
  pendingCredential: AuthCredential,
): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  const normalizedEmail = email.trim().toLowerCase();
  const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
  return linkWithCredential(userCredential.user, pendingCredential);
}

export function getOAuthProviderLabel(methods: string[]): 'Google' | 'Apple' | null {
  if (methods.includes('google.com')) return 'Google';
  if (methods.includes('apple.com')) return 'Apple';
  return null;
}

let pendingLinkCredential: AuthCredential | null = null;

export function takePendingLinkCredential(): AuthCredential | null {
  const credential = pendingLinkCredential;
  pendingLinkCredential = null;
  return credential;
}

export async function throwIfAccountLinkingRequired(
  error: unknown,
  providerLabel: 'Google' | 'Apple',
): Promise<void> {
  const conflict = getAccountExistsConflict(error);
  if (!conflict) {
    return;
  }

  const methods = await fetchEmailSignInMethods(conflict.email);
  if (!methods.includes('password')) {
    return;
  }

  pendingLinkCredential = conflict.pendingCredential;
  throw new AccountLinkingRequiredError(conflict.email, providerLabel);
}
