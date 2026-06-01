import * as SecureStore from 'expo-secure-store';
import type { AuthenticatedUser, AuthTokens } from '@rateq/types';

const ACCESS_KEY = 'rateq_access_token';
const REFRESH_KEY = 'rateq_refresh_token';
const USER_KEY = 'rateq_user';

export async function saveAuth(tokens: AuthTokens, user: AuthenticatedUser): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function clearAuth(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getStoredUser(): Promise<AuthenticatedUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthenticatedUser;
  } catch {
    return null;
  }
}
