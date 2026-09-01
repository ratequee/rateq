import '../global.css';
import { AuthProvider } from '@/context/auth-context';
import { AuthRedirect } from '@/components/auth/auth-redirect';
import { useAppFonts } from '@/hooks/use-app-fonts';
import { RtlRoot } from '@/components/layout/rtl-root';
import { ProfileProvider } from '@/context/profile-context';
import { ThemeProvider, useTheme } from '@/context/theme-context';
import { ToastProvider } from '@/context/toast-context';
import { initI18n } from '@/i18n';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNavigator() {
  const { resolved } = useTheme();

  return (
    <>
      <AuthRedirect />
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="company" />
        <Stack.Screen name="categories" />
        <Stack.Screen name="review/[companyId]" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const fontsLoaded = useAppFonts();
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    void initI18n().then(() => setI18nReady(true));
  }, []);

  useEffect(() => {
    if (fontsLoaded && i18nReady) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, i18nReady]);

  if (!fontsLoaded || !i18nReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <ProfileProvider>
              <RtlRoot>
                <RootNavigator />
              </RtlRoot>
            </ProfileProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
