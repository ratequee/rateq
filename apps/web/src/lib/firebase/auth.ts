import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/client';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

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

export async function firebaseSignInWithGoogle(): Promise<UserCredential> {
  return signInWithPopup(getFirebaseAuth(), googleProvider);
}

export async function firebaseSignOut(): Promise<void> {
  await signOut(getFirebaseAuth());
}

export async function firebaseSendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), email);
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
