import type { AuthenticatedUser, OnboardingStatus } from '@rateq/types';
import { UserRole } from '@rateq/types';
import { getStoredProfile } from '@/lib/profile-storage';

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

export function isCompanyRejected(onboarding?: OnboardingStatus | null): boolean {
  return (
    getLockedAccountType(onboarding) === 'company' &&
    getCompanyVerificationStatus(onboarding) === 'rejected'
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
  isFirebaseAdmin = false,
): boolean {
  if (user.role === UserRole.ADMIN && isFirebaseAdmin) return true;

  const locked = getLockedAccountType(onboarding);
  if (!locked) {
    const profile = getStoredProfile();
    if (profile?.userId !== user.id || !profile.isComplete) return false;
    if (profile.accountType === 'company') {
      return profile.companyVerificationStatus === 'approved';
    }
    return true;
  }

  if (locked === 'reviewer') return true;
  return getCompanyVerificationStatus(onboarding) === 'approved';
}

export function getDashboardPath(
  user: AuthenticatedUser,
  onboarding?: OnboardingStatus | null,
): string {
  if (user.role === UserRole.ADMIN) return '/dashboard/admin';

  const accountType =
    onboarding?.accountType ??
    (getStoredProfile()?.userId === user.id ? getStoredProfile()?.accountType : null);

  if (user.role === UserRole.COMPANY || accountType === 'company') {
    return '/dashboard/company';
  }

  return '/dashboard/reviewer';
}

export function isOnboardingComplete(
  userId: string,
  onboarding?: OnboardingStatus | null,
): boolean {
  if (onboarding) {
    return onboarding.isProfileComplete;
  }

  const profile = getStoredProfile();
  return profile?.userId === userId && profile.isComplete;
}

export function getPostAuthRedirect(
  user: AuthenticatedUser,
  onboarding?: OnboardingStatus | null,
  isFirebaseAdmin = false,
): string {
  if (!user.isVerified) {
    return '/check-email';
  }

  if (isFirebaseAdmin) {
    return '/dashboard/admin';
  }

  if (!canAccessDashboard(user, onboarding, isFirebaseAdmin)) {
    return '/complete-profile';
  }

  return getDashboardPath(user, onboarding);
}

export function getProfileRedirect(user: AuthenticatedUser): string | null {
  const profile = getStoredProfile();
  if (!profile || profile.userId !== user.id || !profile.isComplete) {
    return null;
  }

  if (profile.accountType === 'company' && profile.companyVerificationStatus !== 'approved') {
    return '/complete-profile';
  }

  return getDashboardPath(user);
}
