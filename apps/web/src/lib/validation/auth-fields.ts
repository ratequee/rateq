const NAME_PATTERN = /^[\p{L}]+(?:\s+[\p{L}]+)*$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[a-zA-Z])(?=.*\d).+$/;

export type RegisterFieldErrors = {
  name?: string;
  email?: string;
  password?: string;
};

export type LoginFieldErrors = {
  email?: string;
  password?: string;
};

export function sanitizeDisplayName(value: string): string {
  return value
    .replace(/[^\p{L}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/^\s+/, '');
}

export function validateDisplayName(
  name: string,
  messages: { required: string; invalid: string; min: string; max: string },
): string | undefined {
  const trimmed = name.trim();

  if (!trimmed) {
    return messages.required;
  }

  if (trimmed.length < 2) {
    return messages.min;
  }

  if (trimmed.length > 50) {
    return messages.max;
  }

  if (!NAME_PATTERN.test(trimmed)) {
    return messages.invalid;
  }

  return undefined;
}

export function validateEmailAddress(
  email: string,
  messages: { required: string; invalid: string },
): string | undefined {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed) {
    return messages.required;
  }

  if (!EMAIL_PATTERN.test(trimmed) || trimmed.length > 255) {
    return messages.invalid;
  }

  return undefined;
}

export function validatePassword(
  password: string,
  messages: {
    required: string;
    min: string;
    max: string;
    weak: string;
  },
): string | undefined {
  if (!password) {
    return messages.required;
  }

  if (password.length < 8) {
    return messages.min;
  }

  if (password.length > 128) {
    return messages.max;
  }

  if (!PASSWORD_PATTERN.test(password)) {
    return messages.weak;
  }

  return undefined;
}

export function validateRegisterFields(
  fields: { name: string; email: string; password: string },
  messages: {
    name: { required: string; invalid: string; min: string; max: string };
    email: { required: string; invalid: string };
    password: { required: string; min: string; max: string; weak: string };
  },
): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};

  const nameError = validateDisplayName(fields.name, messages.name);
  const emailError = validateEmailAddress(fields.email, messages.email);
  const passwordError = validatePassword(fields.password, messages.password);

  if (nameError) errors.name = nameError;
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;

  return errors;
}

export function validateLoginFields(
  fields: { email: string; password: string },
  messages: {
    email: { required: string; invalid: string };
    password: { required: string; min: string };
  },
): LoginFieldErrors {
  const errors: LoginFieldErrors = {};

  const emailError = validateEmailAddress(fields.email, messages.email);

  let passwordError: string | undefined;
  if (!fields.password) {
    passwordError = messages.password.required;
  } else if (fields.password.length < 8) {
    passwordError = messages.password.min;
  }

  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;

  return errors;
}
