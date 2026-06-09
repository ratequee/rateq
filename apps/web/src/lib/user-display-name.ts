import type { AuthenticatedUser, OnboardingStatus } from '@rateq/types';

const PENDING_NAME_KEY = 'rateq_pending_name';

export function cachePendingDisplayName(name: string | null | undefined): void {
  const trimmed = name?.trim();
  if (!trimmed) return;
  localStorage.setItem(PENDING_NAME_KEY, trimmed);
}

export function getSuggestedDisplayName(
  user: AuthenticatedUser,
  onboarding?: OnboardingStatus | null,
): string {
  const fromProfile = onboarding?.reviewerProfile?.fullName?.trim();
  if (fromProfile) return fromProfile;

  const fromUser = user.displayName?.trim();
  if (fromUser) return fromUser;

  if (typeof window !== 'undefined') {
    const pending = localStorage.getItem(PENDING_NAME_KEY)?.trim();
    if (pending) return pending;
  }

  const localPart = user.email.split('@')[0] ?? '';
  return localPart.replace(/[._-]/g, ' ').trim() || user.email;
}

export function resolveAccountMenuDisplayName(
  user: AuthenticatedUser,
  onboarding?: OnboardingStatus | null,
): string {
  return getSuggestedDisplayName(user, onboarding);
}
