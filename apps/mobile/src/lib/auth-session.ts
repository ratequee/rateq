import type { AuthTokens } from '@rateq/types';
import Constants from 'expo-constants';
import {
  clearAuth,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  saveTokens,
} from '@/lib/storage';

const API_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  Constants.expoConfig?.extra?.apiUrl ||
  'http://localhost:4000/api/v1';

/** Refresh slightly before expiry so requests do not fail mid-flight. */
const EXPIRY_BUFFER_MS = 60_000;

let refreshInFlight: Promise<string | null> | null = null;

function decodeAccessTokenExpiryMs(token: string): number | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;

    const payload = JSON.parse(atob(segment.replace(/-/g, '+').replace(/_/g, '/'))) as {
      exp?: number;
    };

    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isAccessTokenExpired(token: string, bufferMs = EXPIRY_BUFFER_MS): boolean {
  const expiresAtMs = decodeAccessTokenExpiryMs(token);
  if (!expiresAtMs) return false;
  return Date.now() >= expiresAtMs - bufferMs;
}

/** True when SecureStore still has a refresh session (up to ~7 days). */
export async function hasStoredRefreshSession(): Promise<boolean> {
  const [refreshToken, user] = await Promise.all([getRefreshToken(), getStoredUser()]);
  return Boolean(refreshToken && user);
}

/**
 * Exchange the refresh token for a new access token.
 * Clears the stored session only on definitive auth rejection (401/403) or
 * missing credentials — never on network / 5xx blips.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshToken = await getRefreshToken();
    const user = await getStoredUser();

    if (!refreshToken || !user) {
      await clearAuth();
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.status === 401 || response.status === 403) {
        await clearAuth();
        return null;
      }

      if (!response.ok) {
        // Transient server/network-class failure — keep the 7-day refresh session.
        return null;
      }

      const body = (await response.json()) as { data: AuthTokens };
      await saveTokens(body.data);
      return body.data.accessToken;
    } catch {
      // Offline / fetch failure — do not log the user out.
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/** Returns a valid access token, refreshing with the refresh token when needed. */
export async function ensureValidAccessToken(): Promise<string | null> {
  const existing = await getAccessToken();

  if (existing && !isAccessTokenExpired(existing)) {
    return existing;
  }

  return refreshAccessToken();
}
