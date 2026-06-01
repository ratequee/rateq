import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthenticatedUser, AuthResponse } from '@rateq/types';
import { authApi, setTokenGetter } from '@/lib/api';
import { clearAuth, getAccessToken, getStoredUser, saveAuth } from '@/lib/storage';

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; role?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTokenGetter(getAccessToken);
  }, []);

  const setSession = useCallback(async (response: AuthResponse) => {
    await saveAuth(response.tokens, response.user);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    await clearAuth();
    setUser(null);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authApi.login(email, password);
      await setSession(response);
    },
    [setSession],
  );

  const register = useCallback(
    async (data: { email: string; password: string; role?: string }) => {
      const response = await authApi.register(data);
      await setSession(response);
    },
    [setSession],
  );

  useEffect(() => {
    void (async () => {
      const token = await getAccessToken();
      const stored = await getStoredUser();
      if (!token || !stored) {
        setIsLoading(false);
        return;
      }
      setUser(stored);
      try {
        const me = await authApi.me();
        setUser(me);
      } catch {
        await logout();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [logout]);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
