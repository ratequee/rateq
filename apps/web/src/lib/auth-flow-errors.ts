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

export function isEmailVerificationPendingError(
  error: unknown,
): error is EmailVerificationPendingError {
  return error instanceof EmailVerificationPendingError;
}

export function isEmailNotVerifiedError(error: unknown): error is EmailNotVerifiedError {
  return error instanceof EmailNotVerifiedError;
}
