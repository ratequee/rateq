'use client';

import type { OnboardingStatus } from '@rateq/types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { onboardingApi } from '@/lib/onboarding-api';
import { syncStoredProfileFromOnboarding } from '@/lib/profile-storage';

interface ProfileContextValue {
  onboarding: OnboardingStatus | null;
  isLoading: boolean;
  refreshOnboarding: () => Promise<OnboardingStatus | null>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null);
  const [fetchState, setFetchState] = useState<'idle' | 'loading' | 'done'>('idle');
  const loadedUserIdRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  const refreshOnboarding = useCallback(async () => {
    if (!user) {
      setOnboarding(null);
      setFetchState('done');
      loadedUserIdRef.current = null;
      return null;
    }

    const requestId = ++requestIdRef.current;
    setFetchState('loading');

    try {
      const status = await onboardingApi.getStatus();
      if (requestId !== requestIdRef.current) return null;

      setOnboarding(status);
      syncStoredProfileFromOnboarding(user.id, status);
      loadedUserIdRef.current = user.id;
      setFetchState('done');
      return status;
    } catch {
      if (requestId !== requestIdRef.current) return null;

      setOnboarding((current) => current);
      loadedUserIdRef.current = user.id;
      setFetchState('done');
      return null;
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setOnboarding(null);
      setFetchState('done');
      loadedUserIdRef.current = null;
      return;
    }

    if (loadedUserIdRef.current !== user.id) {
      setOnboarding(null);
      setFetchState('loading');
    }

    void refreshOnboarding();
  }, [user?.id, authLoading, refreshOnboarding]);

  const isLoading = authLoading || (Boolean(user) && fetchState !== 'done');

  const value = useMemo(
    () => ({
      onboarding,
      isLoading,
      refreshOnboarding,
    }),
    [onboarding, isLoading, refreshOnboarding],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
