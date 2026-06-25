'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from '@/i18n/routing';
import { useProfile } from '@/components/providers/profile-provider';
import { canAccessDashboard, getPostAuthRedirect } from '@/lib/profile-routing';
import { useEffect } from 'react';

export function useRequireVerifiedAuth(): void {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!user.isVerified) {
      router.replace('/check-email');
      return;
    }
  }, [user, isLoading, router]);
}

export function useRedirectVerifiedFromCheckEmail(): void {
  const { user, isLoading, adminAccess, adminAccessLoading } = useAuth();
  const { onboarding, isLoading: profileLoading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || profileLoading || adminAccessLoading || !user?.isVerified) return;
    router.replace(getPostAuthRedirect(user, onboarding, adminAccess));
  }, [user, onboarding, isLoading, profileLoading, adminAccessLoading, adminAccess, router]);
}

export function useRequireCompleteProfile(): void {
  const { user, isLoading, adminAccess, adminAccessLoading } = useAuth();
  const { onboarding, isLoading: profileLoading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || profileLoading || adminAccessLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!user.isVerified) {
      router.replace('/check-email');
      return;
    }
    if (!canAccessDashboard(user, onboarding, adminAccess)) {
      router.replace('/complete-profile');
    }
  }, [user, onboarding, isLoading, profileLoading, adminAccessLoading, adminAccess, router]);
}
