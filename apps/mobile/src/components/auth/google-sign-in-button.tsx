import GoogleIcon from '../../../assets/images/google.svg';
import { useAuth } from '@/context/auth-context';
import { useRedirectAfterAuth } from '@/hooks/use-redirect-after-auth';
import { getFontFamily } from '@/i18n';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/errors';
import { isFirebaseConfigured } from '@/lib/firebase/client';
import { ApiError } from '@/lib/api';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, Text } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

function readGoogleClientId(): string | undefined {
  return (
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? Constants.expoConfig?.extra?.googleWebClientId
  );
}

export function GoogleSignInButton() {
  const { t } = useTranslation();
  const { loginWithGoogleIdToken } = useAuth();
  const redirectAfterAuth = useRedirectAfterAuth();
  const [loading, setLoading] = useState(false);

  const clientId = readGoogleClientId();
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type !== 'success') return;

    const idToken = response.params.id_token;
    if (!idToken) return;

    void (async () => {
      setLoading(true);
      try {
        const sessionUser = await loginWithGoogleIdToken(idToken);
        await redirectAfterAuth(sessionUser);
      } catch (err) {
        Alert.alert(
          t('common.error'),
          err instanceof ApiError
            ? err.message
            : getFirebaseAuthErrorMessage(err, t('auth.loginError')),
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [response, loginWithGoogleIdToken, redirectAfterAuth, t]);

  if (!isFirebaseConfigured() || !clientId) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('auth.continueWithGoogle')}
      disabled={!request || loading}
      onPress={() => void promptAsync()}
      className="h-12 flex-row items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white active:bg-slate-50 dark:border-dm-border dark:bg-dm-elevated dark:active:bg-dm-hover"
    >
      {loading ? (
        <ActivityIndicator color="#8E2157" />
      ) : (
        <>
          <GoogleIcon width={20} height={20} />
          <Text
            className="text-sm font-semibold text-ink dark:text-white"
            style={{ fontFamily: getFontFamily('semibold') }}
          >
            {t('auth.continueWithGoogle')}
          </Text>
        </>
      )}
    </Pressable>
  );
}
