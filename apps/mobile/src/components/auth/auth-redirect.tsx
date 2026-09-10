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
  const onVerifyPhone = inAuth && authScreen === 'verify-phone';

  if (!user) {
    // Allow register / verify-phone / other auth screens during unfinished registration
    // (Firebase signed in, RateQ JWT not yet issued).
    if (!inAuth) {
      return <Redirect href="/(auth)/login" />;
    }
    return null;
  }

  const target = getPostAuthRoute(user, onboarding);
  const hasDurablePhone = Boolean(
    user.phoneVerified || onboarding?.reviewerProfile?.phone || onboarding?.company?.phone,
  );

  if (target === '/(auth)/check-email') {
    // Allow dedicated OTP screen when finishing phone verification from this hub.
    if (onVerifyPhone) {
      return null;
    }
    if (!inAuth || authScreen !== 'check-email') {
      return <Redirect href="/(auth)/check-email" />;
    }
    return null;
  }

  if (target === '/(onboarding)/complete-profile') {
    // Allow OTP while finishing profile phone setup.
    if (onVerifyPhone) {
      return null;
    }
    // Stay on the phone hub only until the API (or profile) records a verified phone.
    if (authScreen === 'check-email' && !hasDurablePhone) {
      return null;
    }
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
