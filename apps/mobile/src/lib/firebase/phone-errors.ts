import { FirebaseError } from 'firebase/app';
import { getFirebaseAuthErrorMessage as baseMessage } from '@/lib/firebase/errors';

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

export function getPhoneVerificationErrorMessage(
  error: unknown,
  fallback: string,
  alreadyLinkedMessage: string,
  regionMessage: string,
  credentialMessage: string,
): string {
  if (isFirebasePhoneAlreadyLinkedError(error)) return alreadyLinkedMessage;
  if (isFirebasePhoneRegionNotEnabledError(error)) return regionMessage;
  if (isFirebaseInvalidAppCredentialError(error)) return credentialMessage;
  return baseMessage(error, fallback);
}
