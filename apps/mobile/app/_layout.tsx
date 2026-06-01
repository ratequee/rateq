import '../global.css';
import '@/i18n';
import { AuthProvider } from '@/context/auth-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="company/[slug]" options={{ headerShown: false }} />
          <Stack.Screen name="review/[companyId]" options={{ title: 'Review' }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
