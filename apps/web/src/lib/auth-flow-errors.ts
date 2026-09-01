export class EmailVerificationPendingError extends Error {
  readonly email: string;

  constructor(email: string) {
    super('EMAIL_VERIFICATION_PENDING');
    this.name = 'EmailVerificationPendingError';
    this.email = email;
  }
}

export class EmailNotVerifiedError extends Error {
  readonly email: string;

  constructor(email: string) {
    super('EMAIL_NOT_VERIFIED');
    this.name = 'EmailNotVerifiedError';
    this.email = email;
  }
}

export class AccountLinkingRequiredError extends Error {
  readonly email: string;
  readonly providerLabel: 'Google' | 'Apple';

  constructor(email: string, providerLabel: 'Google' | 'Apple') {
    super('ACCOUNT_LINKING_REQUIRED');
    this.name = 'AccountLinkingRequiredError';
    this.email = email;
    this.providerLabel = providerLabel;
  }
}

export class OAuthOnlyAccountError extends Error {
  readonly email: string;
  readonly providerLabel: 'Google' | 'Apple';

  constructor(email: string, providerLabel: 'Google' | 'Apple') {
    super('OAUTH_ONLY_ACCOUNT');
    this.name = 'OAuthOnlyAccountError';
    this.email = email;
    this.providerLabel = providerLabel;
  }
}

export function isEmailVerificationPendingError(
  error: unknown,
): error is EmailVerificationPendingError {
  return error instanceof EmailVerificationPendingError;
}

export function isEmailNotVerifiedError(error: unknown): error is EmailNotVerifiedError {
  return error instanceof EmailNotVerifiedError;
}

export function isAccountLinkingRequiredError(
  error: unknown,
): error is AccountLinkingRequiredError {
  return error instanceof AccountLinkingRequiredError;
}

export function isOAuthOnlyAccountError(error: unknown): error is OAuthOnlyAccountError {
  return error instanceof OAuthOnlyAccountError;
}
