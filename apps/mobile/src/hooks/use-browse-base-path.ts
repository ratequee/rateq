import { useGuest } from '@/context/guest-context';
import { useAuth } from '@/context/auth-context';

/** Root group for browse screens — keeps guest navigation off the authenticated tabs. */
export function useBrowseBasePath(): '/(guest)' | '/(tabs)' {
  const { user } = useAuth();
  const { isGuest } = useGuest();
  return !user && isGuest ? '/(guest)' : '/(tabs)';
}
