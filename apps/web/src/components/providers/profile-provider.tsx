'use client';

import type { OnboardingStatus } from '@rateq/types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { onboardingApi } from '@/lib/onboarding-api';
import { getAccessToken, getStoredUser } from '@/lib/auth-storage';
import { syncStoredProfileFromOnboarding } from '@/lib/profile-storage';

interface ProfileContextValue {
  onboarding: OnboardingStatus | null;
  isLoading: boolean;
  refreshOnboarding: () => Promise<OnboardingStatus | null>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

function hasStoredSession(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(getAccessToken() && getStoredUser());
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(hasStoredSession);

  const refreshOnboarding = useCallback(async () => {
    if (!user) {
      setOnboarding(null);
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    try {
      const status = await onboardingApi.getStatus();
      setOnboarding(status);
      syncStoredProfileFromOnboarding(user.id, status);
      return status;
    } catch {
      setOnboarding((current) => current);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setOnboarding(null);
      setIsLoading(false);
      return;
    }

    void refreshOnboarding();
  }, [user?.id, authLoading, refreshOnboarding]);

  const value = useMemo(
    () => ({
      onboarding,
      isLoading: authLoading || isLoading,
      refreshOnboarding,
    }),
    [onboarding, authLoading, isLoading, refreshOnboarding],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
