import { ApiError } from '@/lib/api';
import {
  isAccountLinkingRequiredError,
  isEmailNotVerifiedError,
  isEmailVerificationPendingError,
  isOAuthOnlyAccountError,
} from '@/lib/auth-flow-errors';
import {
  isFirebaseInvalidAppCredentialError,
  isFirebasePhoneAlreadyLinkedError,
  isFirebasePhoneRegionNotEnabledError,
  isFirebaseStorageUnauthorizedError,
} from '@/lib/firebase/errors';
import { resolveUserErrorKey, type UserErrorKey } from '@rateq/utils';

type ErrorsTranslator = (key: UserErrorKey) => string;

function translate(t: ErrorsTranslator, key: UserErrorKey): string {
  try {
    return t(key);
  } catch {
    return t('generic');
  }
}

/**
 * Resolve a localized user-facing message for Firebase, API, and network errors.
 * Prefer this over raw `err.message` so Arabic UI never shows English Nest/Firebase text.
 */
export function getUserFacingError(error: unknown, t: ErrorsTranslator, fallback?: string): string {
  if (isEmailVerificationPendingError(error) || isEmailNotVerifiedError(error)) {
    return fallback ?? translate(t, 'emailNotVerified');
  }

  if (isAccountLinkingRequiredError(error) || isOAuthOnlyAccountError(error)) {
    return fallback ?? translate(t, 'oauthOnlyAccount');
  }

  if (isFirebasePhoneAlreadyLinkedError(error)) {
    return translate(t, 'phoneAlreadyLinked');
  }
  if (isFirebasePhoneRegionNotEnabledError(error)) {
    return translate(t, 'phoneRegionDisabled');
  }
  if (isFirebaseInvalidAppCredentialError(error)) {
    return translate(t, 'phoneInvalidAppCredential');
  }
  if (isFirebaseStorageUnauthorizedError(error)) {
    return fallback ?? translate(t, 'forbidden');
  }

  const key = resolveUserErrorKey(
    error instanceof ApiError
      ? { message: error.message, statusCode: error.statusCode, name: error.name }
      : error,
  );

  if (key) {
    return translate(t, key);
  }

  return fallback ?? translate(t, 'generic');
}
