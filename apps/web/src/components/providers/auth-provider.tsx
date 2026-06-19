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
import { EmailNotVerifiedError, EmailVerificationPendingError } from '@/lib/auth-flow-errors';
import {
  firebaseSendEmailVerification,
  firebaseSendPasswordReset,
  firebaseSignIn,
  firebaseSignInWithGoogle,
  firebaseSignOut,
  firebaseSignUp,
  reloadFirebaseUser,
} from '@/lib/firebase/auth';
import { isFirebaseConfigured } from '@/lib/firebase/client';
import { syncFirebaseDisplayNameToClient } from '@/lib/firebase/sync-display-name';
import type { AuthResponse } from '@rateq/types';

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  isFirebaseAdmin: boolean;
  firebaseAdminLoading: boolean;
  login: (email: string, password: string) => Promise<AuthenticatedUser>;
  register: (data: { email: string; password: string; name?: string }) => Promise<void>;
  loginWithGoogle: () => Promise<AuthenticatedUser>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthenticatedUser | null>;
  setSession: (response: AuthResponse) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function exchangeFirebaseSession(): Promise<AuthenticatedUser> {
  const { getFirebaseIdToken } = await import('@/lib/firebase/auth');
  const idToken = await getFirebaseIdToken(true);

  if (!idToken) {
    throw new Error('Unable to retrieve Firebase session');
  }

  try {
    const response = await authApi.firebaseLogin(idToken);
    saveAuth(response.tokens, response.user);
    syncFirebaseDisplayNameToClient(response.user);
    return response.user;
  } catch (err) {
    try {
      await firebaseSignOut();
    } catch {
      // Ignore Firebase sign-out errors during cleanup.
    }
    clearAuth();
    throw err;
  }
}

async function loadFirebaseAdminFlag(): Promise<boolean> {
  const token = getAccessToken();
  if (!token) return false;
  try {
    const result = await authApi.firebaseAdminAccess(token);
    return result.allowed;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirebaseAdmin, setIsFirebaseAdmin] = useState(false);
  const [firebaseAdminLoading, setFirebaseAdminLoading] = useState(false);

  const refreshFirebaseAdmin = useCallback(async () => {
    setFirebaseAdminLoading(true);
    try {
      setIsFirebaseAdmin(await loadFirebaseAdminFlag());
    } finally {
      setFirebaseAdminLoading(false);
    }
  }, []);

  const setSession = useCallback(
    (response: AuthResponse) => {
      saveAuth(response.tokens, response.user);
      setUser(response.user);
      void refreshFirebaseAdmin();
    },
    [refreshFirebaseAdmin],
  );

  const logout = useCallback(async () => {
    const token = getAccessToken();

    try {
      if (isFirebaseConfigured()) {
        await firebaseSignOut();
      }
    } catch {
      // Ignore Firebase sign-out errors during logout.
    }

    if (token) {
      try {
        await authApi.logout(token);
      } catch {
        // Ignore API logout errors during local cleanup.
      }
    }

    clearAuth();
    setUser(null);
    setIsFirebaseAdmin(false);
  }, []);

  const ensureEmailVerifiedSession = useCallback(
    async (email: string) => {
      const { getFirebaseAuth } = await import('@/lib/firebase/client');
      const firebaseUser = getFirebaseAuth().currentUser;

      if (!firebaseUser) {
        throw new Error('Unable to retrieve Firebase session');
      }

      await reloadFirebaseUser(firebaseUser);

      if (!firebaseUser.emailVerified) {
        try {
          await firebaseSendEmailVerification(firebaseUser);
        } catch {
          // Ignore resend errors; user still needs to verify.
        }
        await firebaseSignOut();
        throw new EmailNotVerifiedError(email);
      }

      const sessionUser = await exchangeFirebaseSession();

      if (!sessionUser.isVerified) {
        await firebaseSignOut();
        clearAuth();
        throw new EmailNotVerifiedError(email);
      }

      setUser(sessionUser);
      await refreshFirebaseAdmin();
      return sessionUser;
    },
    [refreshFirebaseAdmin],
  );

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

  const loginWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured');
    }

    await firebaseSignInWithGoogle();
    const sessionUser = await exchangeFirebaseSession();
    setUser(sessionUser);
    await refreshFirebaseAdmin();
    return sessionUser;
  }, [refreshFirebaseAdmin]);

  const refreshSession = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return null;
    }

    try {
      const me = await authApi.me(token);
      syncFirebaseDisplayNameToClient(me);
      setUser(me);
      await refreshFirebaseAdmin();
      return me;
    } catch {
      clearAuth();
      setUser(null);
      return null;
    }
  }, []);

  const resetPassword = useCallback(
    async (email: string) => {
      if (!isFirebaseConfigured()) {
        throw new Error('Firebase is not configured');
      }

      await firebaseSendPasswordReset(email);
    },
    [refreshFirebaseAdmin],
  );

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();

    if (!token || !stored) {
      setIsLoading(false);
      setIsFirebaseAdmin(false);
      return;
    }

    setUser(stored);
    authApi
      .me(token)
      .then(async (me) => {
        syncFirebaseDisplayNameToClient(me);
        setUser(me);
        await refreshFirebaseAdmin();
      })
      .catch(() => {
        clearAuth();
        setUser(null);
        setIsFirebaseAdmin(false);
      })
      .finally(() => setIsLoading(false));
  }, [refreshFirebaseAdmin]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isFirebaseAdmin,
      firebaseAdminLoading,
      login,
      register,
      loginWithGoogle,
      resetPassword,
      resendVerificationEmail,
      logout,
      refreshSession,
      setSession,
    }),
    [
      user,
      isLoading,
      isFirebaseAdmin,
      firebaseAdminLoading,
      login,
      register,
      loginWithGoogle,
      resetPassword,
      resendVerificationEmail,
      logout,
      refreshSession,
      setSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
