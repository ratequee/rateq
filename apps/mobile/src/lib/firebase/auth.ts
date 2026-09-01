import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { OAuthOnlyAccountError } from '@/lib/auth-flow-errors';
import { getFirebaseAuth } from '@/lib/firebase/client';
import {
  fetchEmailSignInMethods,
  getOAuthProviderLabel,
  throwIfAccountLinkingRequired,
} from '@/lib/firebase/account-linking';

export async function firebaseSignIn(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export async function firebaseSignUp(
  email: string,
  password: string,
  displayName?: string,
): Promise<UserCredential> {
  try {
    const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);

    if (displayName?.trim()) {
      await updateProfile(credential.user, { displayName: displayName.trim() });
    }

    return credential;
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/email-already-in-use') {
      const methods = await fetchEmailSignInMethods(email);
      const providerLabel = getOAuthProviderLabel(methods);
      if (providerLabel) {
        throw new OAuthOnlyAccountError(email.trim().toLowerCase(), providerLabel);
      }
    }

    throw error;
  }
}

export async function firebaseSignInWithGoogleIdToken(idToken: string): Promise<UserCredential> {
  const credential = GoogleAuthProvider.credential(idToken);
  try {
    return await signInWithCredential(getFirebaseAuth(), credential);
  } catch (error) {
    await throwIfAccountLinkingRequired(error, 'Google');
    throw error;
  }
}

export async function firebaseSignOut(): Promise<void> {
  await signOut(getFirebaseAuth());
}

export async function firebaseSendEmailVerification(user: User): Promise<void> {
  await sendEmailVerification(user);
}

export async function reloadFirebaseUser(user: User): Promise<void> {
  await user.reload();
}

export async function getFirebaseIdToken(forceRefresh = false): Promise<string | null> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}
