import { FirebaseError } from 'firebase/app';

const ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'This email is already registered.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/user-not-found': 'Invalid email or password.',
  'auth/wrong-password': 'Invalid email or password.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/account-exists-with-different-credential':
    'An account already exists with this email using a different sign-in method.',
};

import { isEmailNotVerifiedError, isEmailVerificationPendingError } from '@/lib/auth-flow-errors';

export function getFirebaseAuthErrorMessage(error: unknown, fallback: string): string {
  if (isEmailVerificationPendingError(error) || isEmailNotVerifiedError(error)) {
    return fallback;
  }

  if (error instanceof FirebaseError) {
    return ERROR_MESSAGES[error.code] ?? error.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
