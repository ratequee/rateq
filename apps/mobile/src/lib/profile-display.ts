import type { OnboardingStatus } from '@rateq/types';
import { UserRole, type AuthenticatedUser } from '@rateq/types';

export function getProfileDisplayName(
  user: AuthenticatedUser,
  onboarding: OnboardingStatus | null,
): string {
  if (user.role === UserRole.COMPANY) {
    return onboarding?.company?.name ?? user.displayName ?? user.email.split('@')[0] ?? 'Company';
  }

  return (
    onboarding?.reviewerProfile?.fullName ??
    user.displayName ??
    user.email.split('@')[0] ??
    'Reviewer'
  );
}

export function getProfileAvatarUrl(
  user: AuthenticatedUser,
  onboarding: OnboardingStatus | null,
): string | null {
  if (user.role === UserRole.COMPANY) {
    return onboarding?.company?.logo ?? null;
  }

  return onboarding?.reviewerProfile?.avatarUrl ?? null;
}
