import { FirebaseError } from 'firebase/app';
import { getUserFacingError } from '@/lib/user-facing-error';
import type { UserErrorKey } from '@rateq/utils';

const PHONE_ALREADY_LINKED_ERROR_CODES = new Set([
  'auth/credential-already-in-use',
  'auth/phone-number-already-exists',
  // Firebase often returns this for phone link collisions; the email-oriented default toast is wrong.
  'auth/account-exists-with-different-credential',
]);

function getErrorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  if (error instanceof FirebaseError) return error.code;
  if ('code' in error && typeof (error as { code?: unknown }).code === 'string') {
    return String((error as { code: string }).code);
  }
  const message = 'message' in error ? String((error as { message?: unknown }).message ?? '') : '';
  const match = message.match(/auth\/[a-z0-9-]+/i);
  return match?.[0]?.toLowerCase() ?? '';
}

export function isFirebasePhoneAlreadyLinkedError(error: unknown): boolean {
  return PHONE_ALREADY_LINKED_ERROR_CODES.has(getErrorCode(error));
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
