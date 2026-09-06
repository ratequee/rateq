import { LoadingView } from '@/components/ui/loading-view';
import { useAuth } from '@/context/auth-context';
import { useProfile } from '@/context/profile-context';
import { getPostAuthRoute } from '@/lib/profile-routing';
import { Redirect, useSegments } from 'expo-router';

export function AuthRedirect() {
  const { user, isLoading: authLoading } = useAuth();
  const { onboarding, isLoading: profileLoading } = useProfile();
  const segments = useSegments();

  if (authLoading || (user && profileLoading)) {
    return <LoadingView />;
  }

  const parts = segments as string[];
  const root = parts[0];
  const inAuth = root === '(auth)';
  const inOnboarding = root === '(onboarding)';
  const authScreen = parts[1];

  if (!user) {
    if (!inAuth) {
      return <Redirect href="/(auth)/login" />;
    }
    return null;
  }

  const target = getPostAuthRoute(user, onboarding);

  if (target === '/(auth)/check-email') {
    if (!inAuth || authScreen !== 'check-email') {
      return <Redirect href="/(auth)/check-email" />;
    }
    return null;
  }

  if (target === '/(onboarding)/complete-profile') {
    if (!inOnboarding) {
      return <Redirect href="/(onboarding)/complete-profile" />;
    }
    return null;
  }

  if (target === '/(tabs)' && (inAuth || inOnboarding)) {
    return <Redirect href="/(tabs)" />;
  }

  return null;
}
