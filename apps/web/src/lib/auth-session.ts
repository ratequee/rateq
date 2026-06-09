import type { AuthTokens } from '@rateq/types';
import {
  clearAuth,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  saveAuth,
} from '@/lib/auth-storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  const user = getStoredUser();

  if (!refreshToken || !user) {
    clearAuth();
    return null;
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });

  if (!response.ok) {
    clearAuth();
    return null;
  }

  const body = (await response.json()) as { data: AuthTokens };
  const tokens = body.data;

  saveAuth(tokens, user);
  return tokens.accessToken;
}

/** Returns a valid access token, refreshing with the refresh token when needed. */
export async function ensureValidAccessToken(): Promise<string | null> {
  const existing = getAccessToken();
  if (existing) {
    return existing;
  }

  return refreshAccessToken();
}
