'use client';

import type { AuthenticatedUser } from '@rateq/types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from '@/lib/api';
import { clearAuth, getAccessToken, getStoredUser, saveAuth } from '@/lib/auth-storage';
import type { AuthResponse } from '@rateq/types';

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => void;
  setSession: (response: AuthResponse) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setSession = useCallback((response: AuthResponse) => {
    saveAuth(response.tokens, response.user);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authApi.login(email, password);
      setSession(response);
    },
    [setSession],
  );

  const register = useCallback(
    async (data: { email: string; password: string; role?: string }) => {
      const response = await authApi.register(data);
      setSession(response);
    },
    [setSession],
  );

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();

    if (!token || !stored) {
      setIsLoading(false);
      return;
    }

    setUser(stored);
    authApi
      .me(token)
      .then(setUser)
      .catch(() => logout())
      .finally(() => setIsLoading(false));
  }, [logout]);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout, setSession }),
    [user, isLoading, login, register, logout, setSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
