/**
 * Stable user-facing error keys. Clients map these to i18n under `errors.*`.
 * Keep keys camelCase and identical on web + mobile.
 */
export type UserErrorKey =
  | 'generic'
  | 'network'
  | 'sessionExpired'
  | 'forbidden'
  | 'notFound'
  | 'rateLimited'
  | 'validationFailed'
  // Auth / email / password
  | 'emailAlreadyInUse'
  | 'invalidEmail'
  | 'incorrectPassword'
  | 'noAccountForEmail'
  | 'invalidCredentials'
  | 'weakPassword'
  | 'passwordSameAsCurrent'
  | 'oauthOnlyAccount'
  | 'accountExistsDifferentCredential'
  | 'signInCancelled'
  | 'accountDeactivated'
  | 'emailNotVerified'
  | 'emailAlreadyVerified'
  | 'verifyEmailBeforeAction'
  // Phone
  | 'phoneAlreadyLinked'
  | 'phoneInvalid'
  | 'phoneOtpInvalid'
  | 'phoneOtpExpired'
  | 'phoneOtpMissing'
  | 'phoneSessionExpired'
  | 'phoneQuotaExceeded'
  | 'phoneCaptchaFailed'
  | 'phoneRegionDisabled'
  | 'phoneRequiresRecentLogin'
  | 'phoneInvalidAppCredential'
  // Profile / company
  | 'companyAlreadyExists'
  | 'reviewerProfileAlreadyExists'
  | 'companyNotFound'
  | 'noCompanyProfile'
  | 'categoryRequired'
  | 'profileChangesMissing'
  | 'revisionNotesRequired'
  // Reviews
  | 'reviewAlreadyPublished'
  | 'reviewAlreadyPending'
  | 'reviewOwnCompany'
  | 'reviewProofRequired'
  | 'reviewProofTooMany'
  | 'reviewContentTooShort'
  | 'replyAlreadyPending'
  | 'replyAlreadyApproved'
  | 'reviewNotFound'
  | 'companyAccountsCannotReview';

export interface ErrorLike {
  code?: string;
  message?: string;
  statusCode?: number;
  name?: string;
}

const FIREBASE_CODE_TO_KEY: Record<string, UserErrorKey> = {
  'auth/email-already-in-use': 'emailAlreadyInUse',
  'auth/invalid-email': 'invalidEmail',
  'auth/wrong-password': 'incorrectPassword',
  'auth/user-not-found': 'noAccountForEmail',
  'auth/invalid-credential': 'invalidCredentials',
  'auth/weak-password': 'weakPassword',
  'auth/too-many-requests': 'rateLimited',
  'auth/network-request-failed': 'network',
  'auth/popup-closed-by-user': 'signInCancelled',
  'auth/cancelled-popup-request': 'signInCancelled',
  'auth/account-exists-with-different-credential': 'accountExistsDifferentCredential',
  'auth/credential-already-in-use': 'phoneAlreadyLinked',
  'auth/phone-number-already-exists': 'phoneAlreadyLinked',
  'auth/captcha-check-failed': 'phoneCaptchaFailed',
  'auth/requires-recent-login': 'phoneRequiresRecentLogin',
  'auth/quota-exceeded': 'phoneQuotaExceeded',
  'auth/invalid-verification-code': 'phoneOtpInvalid',
  'auth/code-expired': 'phoneOtpExpired',
  'auth/missing-verification-code': 'phoneOtpMissing',
  'auth/session-expired': 'phoneSessionExpired',
  'auth/invalid-app-credential': 'phoneInvalidAppCredential',
  'storage/unauthorized': 'forbidden',
  'storage/unauthenticated': 'sessionExpired',
};

/** Exact or includes-match against Nest API English messages → error keys. */
const API_MESSAGE_RULES: Array<{ match: string | RegExp; key: UserErrorKey }> = [
  { match: 'permission denied', key: 'forbidden' },
  { match: 'you must be signed in to upload', key: 'sessionExpired' },
  { match: 'firebase sign-in is not ready', key: 'sessionExpired' },
  { match: 'each project needs a unique url slug', key: 'validationFailed' },
  { match: 'each project can include at most 5 services', key: 'validationFailed' },
  { match: 'awaiting admin review and cannot be edited', key: 'forbidden' },
  { match: 'email is already registered', key: 'emailAlreadyInUse' },
  { match: 'account has been deactivated', key: 'accountDeactivated' },
  { match: 'email is already verified', key: 'emailAlreadyVerified' },
  { match: 'verify your email', key: 'verifyEmailBeforeAction' },
  { match: 'phone number is already linked', key: 'phoneAlreadyLinked' },
  { match: 'already linked to another account', key: 'phoneAlreadyLinked' },
  { match: 'you already have a registered company', key: 'companyAlreadyExists' },
  { match: 'a company profile already exists', key: 'companyAlreadyExists' },
  { match: 'this user already has a registered company', key: 'companyAlreadyExists' },
  { match: 'a reviewer profile already exists', key: 'reviewerProfileAlreadyExists' },
  { match: 'this account already has a reviewer profile', key: 'reviewerProfileAlreadyExists' },
  { match: 'you already have a published review', key: 'reviewAlreadyPublished' },
  { match: 'you already have a review pending', key: 'reviewAlreadyPending' },
  { match: 'cannot review your own company', key: 'reviewOwnCompany' },
  { match: 'company accounts cannot submit reviews', key: 'companyAccountsCannotReview' },
  { match: 'proof file is required', key: 'reviewProofRequired' },
  { match: 'up to 8 proof files', key: 'reviewProofTooMany' },
  { match: 'title or content is too short', key: 'reviewContentTooShort' },
  { match: 'reply is already pending', key: 'replyAlreadyPending' },
  { match: 'pending admin review', key: 'replyAlreadyPending' },
  { match: 'reply already exists', key: 'replyAlreadyApproved' },
  { match: 'already approved', key: 'replyAlreadyApproved' },
  { match: 'no company profile found', key: 'noCompanyProfile' },
  { match: 'company not found', key: 'companyNotFound' },
  { match: 'review not found', key: 'reviewNotFound' },
  { match: 'at least one category is required', key: 'categoryRequired' },
  { match: 'no pending profile changes', key: 'profileChangesMissing' },
  { match: 'revision notes are required', key: 'revisionNotesRequired' },
  { match: 'new password must be different', key: 'passwordSameAsCurrent' },
  { match: 'invalid refresh token', key: 'sessionExpired' },
  { match: 'refresh token expired', key: 'sessionExpired' },
  { match: 'session expired', key: 'sessionExpired' },
  { match: /^email must be/i, key: 'invalidEmail' },
  { match: /password must be/i, key: 'weakPassword' },
  { match: /phone.*(invalid|must)/i, key: 'phoneInvalid' },
];

function normalizeMessage(message: string | undefined): string {
  return (message ?? '').trim().toLowerCase();
}

function extractFirebaseCode(error: ErrorLike | unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const record = error as ErrorLike & { code?: string; message?: string };
  if (typeof record.code === 'string' && record.code.startsWith('auth/')) {
    return record.code;
  }
  if (typeof record.code === 'string' && record.code.startsWith('storage/')) {
    return record.code;
  }
  const message = record.message ?? '';
  const match = message.match(/auth\/[a-z0-9-]+/i) ?? message.match(/storage\/[a-z0-9-]+/i);
  return match?.[0]?.toLowerCase();
}

function mapApiMessage(message: string | undefined): UserErrorKey | null {
  const normalized = normalizeMessage(message);
  if (!normalized) return null;

  for (const rule of API_MESSAGE_RULES) {
    if (typeof rule.match === 'string') {
      if (normalized.includes(rule.match)) return rule.key;
    } else if (rule.match.test(message ?? '') || rule.match.test(normalized)) {
      return rule.key;
    }
  }
  return null;
}

function mapStatusCode(statusCode: number | undefined): UserErrorKey | null {
  if (!statusCode) return null;
  if (statusCode === 401) return 'sessionExpired';
  if (statusCode === 403) return 'forbidden';
  if (statusCode === 404) return 'notFound';
  if (statusCode === 429) return 'rateLimited';
  return null;
}

/**
 * Resolve a stable error key from Firebase, API, or generic errors.
 * Returns null when nothing specific matched (caller should use fallback).
 */
export function resolveUserErrorKey(error: unknown): UserErrorKey | null {
  if (!error) return null;

  if (typeof error === 'string') {
    return mapApiMessage(error);
  }

  const like = error as ErrorLike;
  const firebaseCode = extractFirebaseCode(error);
  if (firebaseCode && FIREBASE_CODE_TO_KEY[firebaseCode]) {
    return FIREBASE_CODE_TO_KEY[firebaseCode];
  }

  const messageKey = mapApiMessage(like.message);
  if (messageKey) return messageKey;

  // Network / failed fetch
  if (
    like.name === 'TypeError' ||
    normalizeMessage(like.message).includes('failed to fetch') ||
    normalizeMessage(like.message).includes('network request failed')
  ) {
    return 'network';
  }

  // Prefer message mapping over bare status codes when we have both;
  // status alone is a last resort (401 without message, etc.)
  const statusKey = mapStatusCode(like.statusCode);
  if (statusKey && !like.message) return statusKey;

  // Validation-style 400 without a mapped message
  if (like.statusCode === 400) {
    return 'validationFailed';
  }

  if (statusKey === 'forbidden' || statusKey === 'notFound' || statusKey === 'rateLimited') {
    return statusKey;
  }

  return null;
}

export function getFirebaseErrorKey(code: string): UserErrorKey | null {
  return FIREBASE_CODE_TO_KEY[code] ?? null;
}
