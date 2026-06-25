import type { AdminAccess, AuthenticatedUser, OnboardingStatus } from '@rateq/types';
import { UserRole, canAccessAdminDashboard } from '@rateq/types';
import { getFirstAllowedAdminRoute } from '@/lib/admin-permissions';
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

function normalizeAdminAccess(
  user: AuthenticatedUser,
  adminAccess?: AdminAccess | null | boolean,
): AdminAccess {
  if (adminAccess && typeof adminAccess === 'object') {
    return adminAccess;
  }

  const allowed =
    typeof adminAccess === 'boolean'
      ? adminAccess
      : user.role === UserRole.ADMIN && canAccessAdminDashboard(user.adminPermissions);

  return {
    allowed,
    permissions: user.adminPermissions ?? [],
  };
}

export function getAdminDashboardHref(
  user: AuthenticatedUser,
  adminAccess?: AdminAccess | null,
): string {
  const access = normalizeAdminAccess(user, adminAccess);
  return getFirstAllowedAdminRoute(access) ?? '/dashboard/admin';
}

export function canAccessDashboard(
  user: AuthenticatedUser,
  onboarding?: OnboardingStatus | null,
  adminAccess?: AdminAccess | null | boolean,
): boolean {
  if (normalizeAdminAccess(user, adminAccess).allowed) return true;

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
  adminAccess?: AdminAccess | null | boolean,
): string {
  if (normalizeAdminAccess(user, adminAccess).allowed) {
    return getAdminDashboardHref(user, normalizeAdminAccess(user, adminAccess));
  }

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
  adminAccess?: AdminAccess | null | boolean,
): string {
  if (!user.isVerified) {
    return '/check-email';
  }

  const access = normalizeAdminAccess(user, adminAccess);
  if (access.allowed) {
    return getAdminDashboardHref(user, access);
  }

  if (!canAccessDashboard(user, onboarding, access)) {
    return '/complete-profile';
  }

  return getDashboardPath(user, onboarding, access);
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

export function getDashboardHref(
  user: AuthenticatedUser,
  onboarding?: OnboardingStatus | null,
  adminAccess?: AdminAccess | null,
): string {
  const access = normalizeAdminAccess(user, adminAccess);
  if (access.allowed) {
    return getAdminDashboardHref(user, access);
  }

  if (!canAccessDashboard(user, onboarding, access)) {
    return getPostAuthRedirect(user, onboarding, access);
  }

  return getDashboardPath(user, onboarding, access);
}
