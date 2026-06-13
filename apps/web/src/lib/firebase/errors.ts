import { FirebaseError } from 'firebase/app';
import { isEmailNotVerifiedError, isEmailVerificationPendingError } from '@/lib/auth-flow-errors';

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
  'auth/credential-already-in-use': 'This phone number is already linked to another account.',
  'auth/phone-number-already-exists': 'This phone number is already linked to another account.',
};

const PHONE_ALREADY_LINKED_ERROR_CODES = new Set([
  'auth/credential-already-in-use',
  'auth/phone-number-already-exists',
]);

export function isFirebasePhoneAlreadyLinkedError(error: unknown): boolean {
  return error instanceof FirebaseError && PHONE_ALREADY_LINKED_ERROR_CODES.has(error.code);
}

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
