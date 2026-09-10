'use client';

import type { AdminAccess, AuthenticatedUser } from '@rateq/types';
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
import { ensureValidAccessToken, hasStoredRefreshSession } from '@/lib/auth-session';
import { EmailNotVerifiedError, EmailVerificationPendingError } from '@/lib/auth-flow-errors';
import {
  firebaseSendEmailVerification,
  firebaseSendPasswordReset,
  firebaseSignIn,
  firebaseSignInWithGoogle,
  firebaseSignInWithApple,
  firebaseSignOut,
  firebaseSignUp,
  reloadFirebaseUser,
} from '@/lib/firebase/auth';
import { isFirebaseConfigured } from '@/lib/firebase/client';
import { syncFirebaseDisplayNameToClient } from '@/lib/firebase/sync-display-name';
import {
  linkPendingCredentialWithPassword,
  takePendingLinkCredential,
} from '@/lib/firebase/account-linking';
import type { AuthResponse } from '@rateq/types';

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  adminAccess: AdminAccess | null;
  adminAccessLoading: boolean;
  /** @deprecated Use adminAccess.allowed */
  isFirebaseAdmin: boolean;
  /** @deprecated Use adminAccessLoading */
  firebaseAdminLoading: boolean;
  login: (email: string, password: string) => Promise<AuthenticatedUser>;
  /** Creates Firebase account and stays signed in for phone verification. */
  beginRegistration: (data: { email: string; password: string; name?: string }) => Promise<void>;
  /** Sends email verification and signs out after phone is verified. */
  finishRegistration: (email: string) => Promise<void>;
  register: (data: { email: string; password: string; name?: string }) => Promise<void>;
  loginWithGoogle: () => Promise<AuthenticatedUser>;
  loginWithApple: () => Promise<AuthenticatedUser>;
  linkOAuthWithPassword: (email: string, password: string) => Promise<AuthenticatedUser>;
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

async function loadAdminAccess(): Promise<AdminAccess> {
  const token = await ensureValidAccessToken();
  if (!token) return { allowed: false, permissions: [] };
  try {
    return await authApi.adminAccess(token);
  } catch {
    return { allowed: false, permissions: [] };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminAccess, setAdminAccess] = useState<AdminAccess | null>(null);
  const [adminAccessLoading, setAdminAccessLoading] = useState(false);

  const refreshAdminAccess = useCallback(async () => {
    setAdminAccessLoading(true);
    try {
      setAdminAccess(await loadAdminAccess());
    } finally {
      setAdminAccessLoading(false);
    }
  }, []);

  const setSession = useCallback(
    (response: AuthResponse) => {
      saveAuth(response.tokens, response.user);
      setUser(response.user);
      void refreshAdminAccess();
    },
    [refreshAdminAccess],
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
    setAdminAccess(null);
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
      await refreshAdminAccess();
      return sessionUser;
    },
    [refreshAdminAccess],
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

  const beginRegistration = useCallback(
    async (data: { email: string; password: string; name?: string }) => {
      if (!isFirebaseConfigured()) {
        throw new Error('Firebase is not configured');
      }

      const normalizedEmail = data.email.trim().toLowerCase();

      try {
        await firebaseSignUp(normalizedEmail, data.password, data.name);
      } catch (error) {
        const { FirebaseError } = await import('firebase/app');
        if (error instanceof FirebaseError && error.code === 'auth/email-already-in-use') {
          const credential = await firebaseSignIn(normalizedEmail, data.password);
          await reloadFirebaseUser(credential.user);
          if (credential.user.emailVerified) {
            throw new Error('This email is already registered. Please log in.');
          }
          if (data.name?.trim() && !credential.user.displayName) {
            const { updateProfile } = await import('firebase/auth');
            await updateProfile(credential.user, { displayName: data.name.trim() });
          }
          return;
        }
        throw error;
      }
    },
    [],
  );

  const finishRegistration = useCallback(async (email: string) => {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured');
    }

    const { getFirebaseAuth } = await import('@/lib/firebase/client');
    const auth = getFirebaseAuth();
    const current = auth.currentUser;
    if (!current) {
      throw new Error('Sign in again to finish registration');
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      await firebaseSendEmailVerification(current);
    } catch {
      throw new Error('Could not send verification email. Please try again.');
    }

    await firebaseSignOut();
    throw new EmailVerificationPendingError(normalizedEmail);
  }, []);

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
    await refreshAdminAccess();
    return sessionUser;
  }, [refreshAdminAccess]);

  const loginWithApple = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured');
    }

    await firebaseSignInWithApple();
    const sessionUser = await exchangeFirebaseSession();
    setUser(sessionUser);
    await refreshAdminAccess();
    return sessionUser;
  }, [refreshAdminAccess]);

  const linkOAuthWithPassword = useCallback(
    async (email: string, password: string) => {
      const pendingCredential = takePendingLinkCredential();

      if (!pendingCredential) {
        throw new Error('No pending sign-in method to link');
      }

      await linkPendingCredentialWithPassword(email, password, pendingCredential);
      const sessionUser = await exchangeFirebaseSession();
      setUser(sessionUser);
      await refreshAdminAccess();
      return sessionUser;
    },
    [refreshAdminAccess],
  );

  const refreshSession = useCallback(async () => {
    const token = await ensureValidAccessToken();
    if (!token) {
      if (!hasStoredRefreshSession()) {
        setUser(null);
      }
      return null;
    }

    try {
      const me = await authApi.me(token);
      syncFirebaseDisplayNameToClient(me);
      setUser(me);
      await refreshAdminAccess();
      return me;
    } catch {
      const stored = getStoredUser();
      if (stored) {
        setUser(stored);
        return stored;
      }
      return null;
    }
  }, [refreshAdminAccess]);

  const resetPassword = useCallback(
    async (email: string) => {
      if (!isFirebaseConfigured()) {
        throw new Error('Firebase is not configured');
      }

      await firebaseSendPasswordReset(email);
    },
    [refreshAdminAccess],
  );

  useEffect(() => {
    void (async () => {
      const stored = getStoredUser();

      if (!stored) {
        setIsLoading(false);
        setAdminAccess(null);
        return;
      }

      setUser(stored);

      const token = await ensureValidAccessToken();
      if (!token) {
        if (!hasStoredRefreshSession()) {
          clearAuth();
          setUser(null);
          setAdminAccess(null);
        }
        setIsLoading(false);
        return;
      }

      try {
        const me = await authApi.me(token);
        syncFirebaseDisplayNameToClient(me);
        setUser(me);
        await refreshAdminAccess();
      } catch {
        setUser(stored);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshAdminAccess]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      adminAccess,
      adminAccessLoading,
      isFirebaseAdmin: adminAccess?.allowed ?? false,
      firebaseAdminLoading: adminAccessLoading,
      login,
      beginRegistration,
      finishRegistration,
      register,
      loginWithGoogle,
      loginWithApple,
      linkOAuthWithPassword,
      resetPassword,
      resendVerificationEmail,
      logout,
      refreshSession,
      setSession,
    }),
    [
      user,
      isLoading,
      adminAccess,
      adminAccessLoading,
      login,
      beginRegistration,
      finishRegistration,
      register,
      loginWithGoogle,
      loginWithApple,
      linkOAuthWithPassword,
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
