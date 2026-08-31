import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { getStoredTheme, setStoredTheme, type ThemePreference } from '@/lib/preferences';

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: 'light' | 'dark';
  setPreference: (theme: ThemePreference) => Promise<void>;
  toggle: () => Promise<void>;
  isReady: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useNativeWindColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const stored = await getStoredTheme();
      const next = stored ?? 'system';
      setPreferenceState(next);
      setColorScheme(next);
      setIsReady(true);
    })();
  }, [setColorScheme]);

  const setPreference = useCallback(
    async (theme: ThemePreference) => {
      setPreferenceState(theme);
      setColorScheme(theme);
      await setStoredTheme(theme);
    },
    [setColorScheme],
  );

  const toggle = useCallback(async () => {
    const resolved = colorScheme === 'dark' ? 'dark' : 'light';
    const next = resolved === 'dark' ? 'light' : 'dark';
    await setPreference(next);
  }, [colorScheme, setPreference]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolved: colorScheme === 'dark' ? 'dark' : 'light',
      setPreference,
      toggle,
      isReady,
    }),
    [colorScheme, isReady, preference, setPreference, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
