import { FirebaseError } from 'firebase/app';
import {
  isAccountLinkingRequiredError,
  isEmailNotVerifiedError,
  isEmailVerificationPendingError,
  isOAuthOnlyAccountError,
} from '@/lib/auth-flow-errors';
import { getFirebaseErrorKey } from '@rateq/utils';

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
  if (isFirebaseStorageUnauthorizedError(error)) {
    return fallback;
  }
  return fallback;
}

/**
 * Legacy helper — returns fallback for known Firebase codes (never raw English Firebase text).
 * Prefer `getUserFacingError` from `@/lib/user-facing-error` with the `errors` translator.
 */
export function getFirebaseAuthErrorMessage(error: unknown, fallback: string): string {
  if (isEmailVerificationPendingError(error) || isEmailNotVerifiedError(error)) {
    return fallback;
  }
  if (isAccountLinkingRequiredError(error) || isOAuthOnlyAccountError(error)) {
    return fallback;
  }

  if (error instanceof FirebaseError && getFirebaseErrorKey(error.code)) {
    return fallback;
  }

  return fallback;
}
