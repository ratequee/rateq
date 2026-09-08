import { getFirebaseErrorKey } from '@rateq/utils';

/**
 * Legacy helper — returns fallback for known Firebase codes (never raw English Firebase text).
 * Prefer `getUserFacingError` from `@/lib/user-facing-error`.
 */
export function getFirebaseAuthErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    const codeMatch = error.message.match(/auth\/[a-z0-9-]+/i);
    if (codeMatch && getFirebaseErrorKey(codeMatch[0].toLowerCase())) {
      return fallback;
    }
  }
  return fallback;
}
