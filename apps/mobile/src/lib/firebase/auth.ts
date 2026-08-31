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
import { getFirebaseAuth } from '@/lib/firebase/client';

export async function firebaseSignIn(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export async function firebaseSignUp(
  email: string,
  password: string,
  displayName?: string,
): Promise<UserCredential> {
  const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);

  if (displayName?.trim()) {
    await updateProfile(credential.user, { displayName: displayName.trim() });
  }

  return credential;
}

export async function firebaseSignInWithGoogleIdToken(idToken: string): Promise<UserCredential> {
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(getFirebaseAuth(), credential);
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
