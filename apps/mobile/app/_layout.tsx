import '../global.css';
import { AuthProvider } from '@/context/auth-context';
import { GuestProvider } from '@/context/guest-context';
import { AuthRedirect } from '@/components/auth/auth-redirect';
import { LoadingView } from '@/components/ui/loading-view';
import { useAppFonts } from '@/hooks/use-app-fonts';
import { RtlRoot } from '@/components/layout/rtl-root';
import { ProfileProvider } from '@/context/profile-context';
import { ThemeProvider, useTheme } from '@/context/theme-context';
import { ToastProvider } from '@/context/toast-context';
import { initI18n } from '@/i18n';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

class BootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('BootErrorBoundary', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: '#8E2157', fontSize: 16, textAlign: 'center' }}>
            {this.state.error.message}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function RootNavigator() {
  const { resolved } = useTheme();

  return (
    <>
      <AuthRedirect />
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(guest)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="admin" />
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
    void initI18n()
      .then(() => setI18nReady(true))
      .catch((err) => {
        console.error('initI18n failed', err);
        setI18nReady(true);
      });
  }, []);

  useEffect(() => {
    if (fontsLoaded && i18nReady) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, i18nReady]);

  if (!fontsLoaded || !i18nReady) {
    return <LoadingView />;
  }

  return (
    <BootErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <GuestProvider>
                <ProfileProvider>
                  <RtlRoot>
                    <RootNavigator />
                  </RtlRoot>
                </ProfileProvider>
              </GuestProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </BootErrorBoundary>
  );
}
