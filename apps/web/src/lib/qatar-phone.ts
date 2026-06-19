export const QATAR_PHONE_PREFIX = '+974';
export const QATAR_PHONE_DIGITS = 8;
export const QATAR_PHONE_PATTERN = /^\+974\d{8}$/;

export function sanitizeQatarPhoneDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, QATAR_PHONE_DIGITS);
}

export function extractQatarPhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith('974')) {
    return digits.slice(3, 3 + QATAR_PHONE_DIGITS);
  }

  return digits.slice(0, QATAR_PHONE_DIGITS);
}

export function formatQatarPhoneForSubmit(digits: string): string {
  return `${QATAR_PHONE_PREFIX}${sanitizeQatarPhoneDigits(digits)}`;
}

export function isValidQatarPhoneDigits(digits: string): boolean {
  return /^\d{8}$/.test(sanitizeQatarPhoneDigits(digits));
}

export function isValidQatarPhone(value: string): boolean {
  const trimmed = value.trim();
  if (QATAR_PHONE_PATTERN.test(trimmed)) return true;
  return isValidQatarPhoneDigits(trimmed);
}

export function normalizeQatarPhone(value: string): string {
  const digits = extractQatarPhoneDigits(value);
  return formatQatarPhoneForSubmit(digits);
}
