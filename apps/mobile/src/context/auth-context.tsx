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
import { EmailNotVerifiedError, EmailVerificationPendingError } from '@/lib/auth-flow-errors';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase/client';
import {
  firebaseSendEmailVerification,
  firebaseSignIn,
  firebaseSignInWithGoogleIdToken,
  firebaseSignOut,
  firebaseSignUp,
  getFirebaseIdToken,
  reloadFirebaseUser,
} from '@/lib/firebase/auth';
import { clearAuth, getStoredUser, saveAuth } from '@/lib/storage';
import { ensureValidAccessToken } from '@/lib/auth-session';

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthenticatedUser>;
  register: (data: { email: string; password: string; name?: string }) => Promise<void>;
  loginWithGoogleIdToken: (idToken: string) => Promise<AuthenticatedUser>;
  resendVerificationEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthenticatedUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function exchangeFirebaseSession(): Promise<AuthenticatedUser> {
  const idToken = await getFirebaseIdToken(true);

  if (!idToken) {
    throw new Error('Unable to retrieve Firebase session');
  }

  try {
    const response = await authApi.firebaseLogin(idToken);
    await saveAuth(response.tokens, response.user);
    return response.user;
  } catch (err) {
    try {
      await firebaseSignOut();
    } catch {
      // ignore
    }
    await clearAuth();
    throw err;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTokenGetter(ensureValidAccessToken);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (isFirebaseConfigured()) {
        await firebaseSignOut();
      }
    } catch {
      // ignore
    }

    try {
      await authApi.logout();
    } catch {
      // ignore
    }

    await clearAuth();
    setUser(null);
  }, []);

  const ensureEmailVerifiedSession = useCallback(async (email: string) => {
    const firebaseUser = getFirebaseAuth().currentUser;

    if (!firebaseUser) {
      throw new Error('Unable to retrieve Firebase session');
    }

    await reloadFirebaseUser(firebaseUser);

    if (!firebaseUser.emailVerified) {
      try {
        await firebaseSendEmailVerification(firebaseUser);
      } catch {
        // ignore
      }
      await firebaseSignOut();
      throw new EmailNotVerifiedError(email);
    }

    const sessionUser = await exchangeFirebaseSession();

    if (!sessionUser.isVerified) {
      await firebaseSignOut();
      await clearAuth();
      throw new EmailNotVerifiedError(email);
    }

    setUser(sessionUser);
    return sessionUser;
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      if (!isFirebaseConfigured()) {
        throw new Error('Firebase is not configured');
      }

      const normalizedEmail = email.trim().toLowerCase();
      await firebaseSignIn(normalizedEmail, password);
      return ensureEmailVerifiedSession(normalizedEmail);
    },
    [ensureEmailVerifiedSession],
  );

  const register = useCallback(async (data: { email: string; password: string; name?: string }) => {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured');
    }

    const normalizedEmail = data.email.trim().toLowerCase();
    const credential = await firebaseSignUp(normalizedEmail, data.password, data.name);

    try {
      await firebaseSendEmailVerification(credential.user);
    } catch {
      await firebaseSignOut();
      throw new Error('Could not send verification email. Please try again.');
    }

    await firebaseSignOut();
    throw new EmailVerificationPendingError(normalizedEmail);
  }, []);

  const resendVerificationEmail = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const credential = await firebaseSignIn(normalizedEmail, password);
    await reloadFirebaseUser(credential.user);

    if (credential.user.emailVerified) {
      await firebaseSignOut();
      throw new Error('Email is already verified. You can log in.');
    }

    await firebaseSendEmailVerification(credential.user);
    await firebaseSignOut();
  }, []);

  const loginWithGoogleIdToken = useCallback(async (idToken: string) => {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured');
    }

    await firebaseSignInWithGoogleIdToken(idToken);
    const sessionUser = await exchangeFirebaseSession();
    setUser(sessionUser);
    return sessionUser;
  }, []);

  const refreshSession = useCallback(async () => {
    const token = await ensureValidAccessToken();
    if (!token) {
      setUser(null);
      return null;
    }

    try {
      const me = await authApi.me();
      setUser(me);
      return me;
    } catch {
      await clearAuth();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const stored = await getStoredUser();
      if (!stored) {
        setIsLoading(false);
        return;
      }

      setUser(stored);

      const token = await ensureValidAccessToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const me = await authApi.me();
        setUser(me);
      } catch {
        await clearAuth();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      register,
      loginWithGoogleIdToken,
      resendVerificationEmail,
      logout,
      refreshSession,
    }),
    [
      user,
      isLoading,
      login,
      register,
      loginWithGoogleIdToken,
      resendVerificationEmail,
      logout,
      refreshSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
