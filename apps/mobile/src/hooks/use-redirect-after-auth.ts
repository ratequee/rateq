import type { AuthenticatedUser } from '@rateq/types';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useProfile } from '@/context/profile-context';
import { getPostAuthRoute } from '@/lib/profile-routing';

export function useRedirectAfterAuth() {
  const router = useRouter();
  const { refreshOnboarding } = useProfile();

  return useCallback(
    async (sessionUser: AuthenticatedUser) => {
      const onboarding = await refreshOnboarding();
      router.replace(getPostAuthRoute(sessionUser, onboarding));
    },
    [refreshOnboarding, router],
  );
}
