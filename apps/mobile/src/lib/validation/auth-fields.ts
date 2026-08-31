export interface AuthFieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuthFields(
  fields: { email: string; password: string },
  messages: {
    emailRequired: string;
    emailInvalid: string;
    passwordRequired: string;
    passwordMin: string;
  },
): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const email = fields.email.trim();

  if (!email) errors.email = messages.emailRequired;
  else if (!EMAIL_RE.test(email)) errors.email = messages.emailInvalid;

  if (!fields.password) errors.password = messages.passwordRequired;
  else if (fields.password.length < 8) errors.password = messages.passwordMin;

  return errors;
}
