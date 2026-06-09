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
  const { user, isLoading, isFirebaseAdmin, firebaseAdminLoading } = useAuth();
  const { onboarding, isLoading: profileLoading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || profileLoading || firebaseAdminLoading || !user?.isVerified) return;
    router.replace(getPostAuthRedirect(user, onboarding, isFirebaseAdmin));
  }, [user, onboarding, isLoading, profileLoading, firebaseAdminLoading, isFirebaseAdmin, router]);
}

export function useRequireCompleteProfile(): void {
  const { user, isLoading, isFirebaseAdmin, firebaseAdminLoading } = useAuth();
  const { onboarding, isLoading: profileLoading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || profileLoading || firebaseAdminLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!user.isVerified) {
      router.replace('/check-email');
      return;
    }
    if (!canAccessDashboard(user, onboarding, isFirebaseAdmin)) {
      router.replace('/complete-profile');
    }
  }, [user, onboarding, isLoading, profileLoading, firebaseAdminLoading, isFirebaseAdmin, router]);
}
