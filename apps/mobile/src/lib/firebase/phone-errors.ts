import { FirebaseError } from 'firebase/app';
import { getUserFacingError } from '@/lib/user-facing-error';
import type { UserErrorKey } from '@rateq/utils';

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

/** Prefer shared localized mapper over raw Firebase English messages. */
export function getPhoneVerificationErrorMessage(
  error: unknown,
  t: (key: UserErrorKey) => string,
  fallback?: string,
): string {
  return getUserFacingError(error, t, fallback);
}
