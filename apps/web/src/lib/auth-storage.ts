import type { AuthTokens, AuthenticatedUser } from '@rateq/types';
import { clearStoredProfile } from '@/lib/profile-storage';

const ACCESS_KEY = 'rateq_access_token';
const REFRESH_KEY = 'rateq_refresh_token';
const USER_KEY = 'rateq_user';

export function saveAuth(tokens: AuthTokens, user: AuthenticatedUser): void {
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  clearStoredProfile();
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): AuthenticatedUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthenticatedUser;
  } catch {
    return null;
  }
}
