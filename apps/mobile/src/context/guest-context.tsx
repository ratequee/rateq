import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/context/auth-context';
import { getStoredGuestMode, setStoredGuestMode } from '@/lib/preferences';

interface GuestContextValue {
  isGuest: boolean;
  isLoading: boolean;
  enterGuestMode: () => Promise<void>;
  exitGuestMode: () => Promise<void>;
}

const GuestContext = createContext<GuestContextValue | null>(null);

export function GuestProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stored = await getStoredGuestMode();
        if (!cancelled) setIsGuest(stored);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const exitGuestMode = useCallback(async () => {
    await setStoredGuestMode(false);
    setIsGuest(false);
  }, []);

  const enterGuestMode = useCallback(async () => {
    await setStoredGuestMode(true);
    setIsGuest(true);
  }, []);

  // Authenticated sessions always win over guest browsing.
  useEffect(() => {
    if (!user || !isGuest) return;
    void exitGuestMode();
  }, [user, isGuest, exitGuestMode]);

  const value = useMemo(
    () => ({
      isGuest: Boolean(isGuest && !user),
      isLoading,
      enterGuestMode,
      exitGuestMode,
    }),
    [isGuest, user, isLoading, enterGuestMode, exitGuestMode],
  );

  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
}

export function useGuest() {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error('useGuest must be used within GuestProvider');
  return ctx;
}
