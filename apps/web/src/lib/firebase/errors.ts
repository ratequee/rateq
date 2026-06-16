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
  'auth/captcha-check-failed': 'Security check failed. Please wait a moment and try again.',
  'auth/requires-recent-login': 'Please sign in again to change your phone number.',
  'auth/quota-exceeded': 'Too many SMS requests. Please try again later.',
  'auth/invalid-verification-code': 'Invalid or expired verification code.',
  'auth/code-expired': 'Verification code expired. Request a new code.',
  'auth/missing-verification-code': 'Enter the verification code we sent you.',
  'auth/session-expired': 'Verification session expired. Request a new code.',
};

const PHONE_ALREADY_LINKED_ERROR_CODES = new Set([
  'auth/credential-already-in-use',
  'auth/phone-number-already-exists',
]);

export function isFirebasePhoneAlreadyLinkedError(error: unknown): boolean {
  return error instanceof FirebaseError && PHONE_ALREADY_LINKED_ERROR_CODES.has(error.code);
}

export function isFirebasePhoneRegionNotEnabledError(error: unknown): boolean {
  if (!(error instanceof FirebaseError)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes('sms unable to be sent until this region enabled') ||
    message.includes('region enabled by the app developer')
  );
}

export function isFirebaseInvalidAppCredentialError(error: unknown): boolean {
  if (!(error instanceof FirebaseError)) return false;

  return (
    error.code === 'auth/invalid-app-credential' ||
    error.message.toLowerCase().includes('invalid_app_credential')
  );
}

export function isFirebaseStorageUnauthorizedError(error: unknown): boolean {
  if (!(error instanceof FirebaseError)) return false;

  return error.code === 'storage/unauthorized' || error.code === 'storage/unauthenticated';
}

export function getFirebaseStorageErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof FirebaseError) {
    if (isFirebaseStorageUnauthorizedError(error)) {
      return fallback;
    }
    return error.message || fallback;
  }

  if (error instanceof Error && error.message.toLowerCase().includes('permission denied')) {
    return fallback;
  }

  return fallback;
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
