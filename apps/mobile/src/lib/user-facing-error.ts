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
} from '@/lib/firebase/phone-errors';
import { resolveUserErrorKey, type UserErrorKey } from '@rateq/utils';

type ErrorsTranslator = (key: UserErrorKey) => string;

function translate(t: ErrorsTranslator, key: UserErrorKey): string {
  try {
    const value = t(key);
    return value || t('generic');
  } catch {
    return t('generic');
  }
}

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
