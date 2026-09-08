export interface AuthFieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_UPPERCASE = /[A-Z]/;
const PASSWORD_DIGIT = /\d/;
const PASSWORD_SPECIAL = /[^A-Za-z0-9]/;

export type PasswordRequirementKey = 'minLength' | 'uppercase' | 'digit' | 'special';

export type PasswordRequirements = Record<PasswordRequirementKey, boolean>;

export function getPasswordRequirements(password: string): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    uppercase: PASSWORD_UPPERCASE.test(password),
    digit: PASSWORD_DIGIT.test(password),
    special: PASSWORD_SPECIAL.test(password),
  };
}

export function arePasswordRequirementsMet(password: string): boolean {
  const requirements = getPasswordRequirements(password);
  return (
    requirements.minLength &&
    requirements.uppercase &&
    requirements.digit &&
    requirements.special &&
    !/\s/.test(password)
  );
}

export function validateEmailField(
  email: string,
  messages: {
    emailRequired: string;
    emailInvalid: string;
  },
): Pick<AuthFieldErrors, 'email'> {
  const errors: Pick<AuthFieldErrors, 'email'> = {};
  const trimmed = email.trim();

  if (!trimmed) errors.email = messages.emailRequired;
  else if (!EMAIL_RE.test(trimmed)) errors.email = messages.emailInvalid;

  return errors;
}

export function validateAuthFields(
  fields: { email: string; password: string },
  messages: {
    emailRequired: string;
    emailInvalid: string;
    passwordRequired: string;
    passwordMin: string;
  },
): AuthFieldErrors {
  const errors: AuthFieldErrors = {
    ...validateEmailField(fields.email, messages),
  };

  if (!fields.password) errors.password = messages.passwordRequired;
  else if (fields.password.length < 8) errors.password = messages.passwordMin;

  return errors;
}

/** Strong password checks for registration only. */
export function validateStrongAuthPassword(
  password: string,
  messages: {
    passwordRequired: string;
    passwordWeak: string;
  },
): Pick<AuthFieldErrors, 'password'> {
  const errors: Pick<AuthFieldErrors, 'password'> = {};
  if (!password) {
    errors.password = messages.passwordRequired;
  } else if (!arePasswordRequirementsMet(password)) {
    errors.password = messages.passwordWeak;
  }
  return errors;
}
