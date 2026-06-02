import type { AuthenticatedUser } from '@rateq/types';
import { UserRole } from '@rateq/types';
import { getStoredProfile, isProfileComplete } from '@/lib/profile-storage';

export function getDashboardPath(user: AuthenticatedUser): string {
  if (user.role === UserRole.ADMIN) return '/dashboard/admin';

  const profile = getStoredProfile();
  if (profile?.userId === user.id && profile.isComplete) {
    return profile.accountType === 'company' ? '/dashboard/company' : '/dashboard/reviewer';
  }

  if (user.role === UserRole.COMPANY) return '/dashboard/company';
  return '/dashboard/reviewer';
}

export function getPostAuthRedirect(user: AuthenticatedUser): string {
  if (!isProfileComplete(user.id)) {
    return '/complete-profile';
  }
  return getDashboardPath(user);
}

export function getProfileRedirect(user: AuthenticatedUser): string | null {
  const profile = getStoredProfile();
  if (!profile || profile.userId !== user.id || !profile.isComplete) {
    return null;
  }

  if (profile.accountType === 'company' && profile.companyVerificationStatus === 'rejected') {
    return '/complete-profile';
  }

  return getDashboardPath(user);
}
