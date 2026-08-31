import type { AuthenticatedUser, OnboardingStatus } from '@rateq/types';
import { UserRole } from '@rateq/types';

export type MobileAppRoute =
  | '/(auth)/login'
  | '/(auth)/check-email'
  | '/(onboarding)/complete-profile'
  | '/(tabs)';

export function getCompanyVerificationStatus(
  onboarding?: OnboardingStatus | null,
): 'pending' | 'approved' | 'rejected' | 'revision_requested' | null {
  return onboarding?.company?.verificationStatus ?? null;
}

export function getLockedAccountType(
  onboarding?: OnboardingStatus | null,
): 'reviewer' | 'company' | null {
  if (!onboarding?.isProfileComplete) return null;
  return onboarding.accountType ?? null;
}

export function isCompanyPendingApproval(onboarding?: OnboardingStatus | null): boolean {
  return (
    getLockedAccountType(onboarding) === 'company' &&
    getCompanyVerificationStatus(onboarding) === 'pending'
  );
}

export function isCompanyRevisionRequested(onboarding?: OnboardingStatus | null): boolean {
  return (
    getLockedAccountType(onboarding) === 'company' &&
    getCompanyVerificationStatus(onboarding) === 'revision_requested'
  );
}

export function canAccessDashboard(
  user: AuthenticatedUser,
  onboarding?: OnboardingStatus | null,
): boolean {
  if (user.role === UserRole.ADMIN) return true;

  const locked = getLockedAccountType(onboarding);
  if (!locked) return false;
  if (locked === 'reviewer') return true;
  return getCompanyVerificationStatus(onboarding) === 'approved';
}

export function getPostAuthRoute(
  user: AuthenticatedUser,
  onboarding?: OnboardingStatus | null,
): MobileAppRoute {
  if (!user.isVerified) {
    return '/(auth)/check-email';
  }

  if (!canAccessDashboard(user, onboarding)) {
    return '/(onboarding)/complete-profile';
  }

  return '/(tabs)';
}
