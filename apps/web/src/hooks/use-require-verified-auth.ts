'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from '@/i18n/routing';
import { useProfile } from '@/components/providers/profile-provider';
import { getLinkedFirebasePhoneNumber } from '@/lib/firebase/phone-auth';
import { canAccessDashboard, getPostAuthRedirect } from '@/lib/profile-routing';
import { useEffect } from 'react';

export function useRequireVerifiedAuth(): { isAllowed: boolean } {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!user.isVerified) {
      router.replace(`/check-email?email=${encodeURIComponent(user.email)}`);
    }
  }, [user, isLoading, router]);

  return {
    isAllowed: !isLoading && Boolean(user?.isVerified),
  };
}

export function useRedirectVerifiedFromCheckEmail(): void {
  const { user, isLoading, adminAccess, adminAccessLoading } = useAuth();
  const { onboarding, isLoading: profileLoading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || profileLoading || adminAccessLoading || !user?.isVerified) return;

    // Stay when a verified user still needs phone before profile completion.
    const hasProfilePhone = Boolean(
      onboarding?.reviewerProfile?.phone || onboarding?.company?.phone,
    );
    if (!onboarding?.isProfileComplete && !hasProfilePhone && !getLinkedFirebasePhoneNumber()) {
      return;
    }

    router.replace(getPostAuthRedirect(user, onboarding, adminAccess));
  }, [user, onboarding, isLoading, profileLoading, adminAccessLoading, adminAccess, router]);
}

export function useRequireCompleteProfile(): { isAllowed: boolean } {
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
      router.replace(`/check-email?email=${encodeURIComponent(user.email)}`);
      return;
    }
    if (!canAccessDashboard(user, onboarding, adminAccess)) {
      router.replace('/complete-profile');
    }
  }, [user, onboarding, isLoading, profileLoading, adminAccessLoading, adminAccess, router]);

  return {
    isAllowed:
      !isLoading &&
      !profileLoading &&
      !adminAccessLoading &&
      Boolean(user?.isVerified) &&
      Boolean(user && canAccessDashboard(user, onboarding, adminAccess)),
  };
}
