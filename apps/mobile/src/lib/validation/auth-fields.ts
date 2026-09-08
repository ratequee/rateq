export interface AuthFieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
