export function getFirebaseAuthErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    if (error.message.includes('auth/invalid-credential')) {
      return fallback;
    }
    if (error.message.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists.';
    }
    if (error.message.includes('auth/too-many-requests')) {
      return 'Too many attempts. Please try again later.';
    }
    if (error.message.includes('auth/network-request-failed')) {
      return 'Network error. Check your connection and try again.';
    }
    if (error.message.includes('auth/credential-already-in-use')) {
      return 'This phone number is already linked to another account.';
    }
    if (error.message.includes('auth/invalid-verification-code')) {
      return 'Invalid or expired verification code.';
    }
    if (error.message.includes('auth/code-expired')) {
      return 'Verification code expired. Request a new code.';
    }
    if (error.message.includes('auth/captcha-check-failed')) {
      return 'Security check failed. Please try again.';
    }
    return error.message;
  }

  return fallback;
}
