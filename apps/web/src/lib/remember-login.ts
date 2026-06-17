const REMEMBER_EMAIL_KEY = 'rateq_remember_email';

export function loadRememberedEmail(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(REMEMBER_EMAIL_KEY) ?? '';
}

export function saveRememberedEmail(email: string, remember: boolean): void {
  if (typeof window === 'undefined') return;

  if (remember) {
    localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim().toLowerCase());
    return;
  }

  localStorage.removeItem(REMEMBER_EMAIL_KEY);
}
