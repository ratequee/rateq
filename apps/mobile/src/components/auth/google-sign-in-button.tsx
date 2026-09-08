import GoogleIcon from '../../../assets/images/google.svg';
import { AccountLinkingDialog } from '@/components/auth/account-linking-dialog';
import { SocialSignInButton } from '@/components/auth/social-sign-in-button';
import { useAuth } from '@/context/auth-context';
import { useRedirectAfterAuth } from '@/hooks/use-redirect-after-auth';
import { useAppToast } from '@/hooks/use-app-toast';
import { AccountLinkingRequiredError, isAccountLinkingRequiredError } from '@/lib/auth-flow-errors';
import { isFirebaseConfigured } from '@/lib/firebase/client';
import type { AuthenticatedUser } from '@rateq/types';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

function readGoogleWebClientId(): string | undefined {
  return (
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? Constants.expoConfig?.extra?.googleWebClientId
  );
}

function configureGoogleSignIn(webClientId: string) {
  GoogleSignin.configure({
    webClientId,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    offlineAccess: false,
  });
}

interface GoogleSignInButtonProps {
  onSuccess?: (user: AuthenticatedUser) => void | Promise<void>;
}

export function GoogleSignInButton({ onSuccess }: GoogleSignInButtonProps) {
  const { t } = useTranslation();
  const { loginWithGoogleIdToken, linkOAuthWithPassword } = useAuth();
  const redirectAfterAuth = useRedirectAfterAuth();
  const toast = useAppToast();
  const [loading, setLoading] = useState(false);
  const [linkingRequest, setLinkingRequest] = useState<AccountLinkingRequiredError | null>(null);
  const [ready, setReady] = useState(false);

  const webClientId = readGoogleWebClientId();

  useEffect(() => {
    if (!webClientId) return;
    try {
      configureGoogleSignIn(webClientId);
      setReady(true);
    } catch {
      setReady(false);
    }
  }, [webClientId]);

  const handlePress = async () => {
    if (!webClientId) return;

    setLoading(true);
    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) {
        return;
      }

      const idToken = response.data.idToken;
      if (!idToken) {
        toast.error(t('auth.googleSignInNoToken'));
        return;
      }

      const sessionUser = await loginWithGoogleIdToken(idToken);
      await (onSuccess ? onSuccess(sessionUser) : redirectAfterAuth(sessionUser));
    } catch (err) {
      if (isAccountLinkingRequiredError(err)) {
        setLinkingRequest(err);
        return;
      }

      if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }

      if (isErrorWithCode(err) && err.code === statusCodes.IN_PROGRESS) {
        return;
      }

      if (isErrorWithCode(err) && err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        toast.error(t('auth.googlePlayServicesUnavailable'));
        return;
      }

      // DEVELOPER_ERROR / 10 usually means SHA-1 / package name mismatch in Google Cloud
      toast.apiError(err, t('auth.googleSignInError'));
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async (password: string) => {
    if (!linkingRequest) return;

    setLoading(true);
    try {
      const sessionUser = await linkOAuthWithPassword(linkingRequest.email, password);
      setLinkingRequest(null);
      toast.success(t('auth.linkAccountSuccess'));
      await (onSuccess ? onSuccess(sessionUser) : redirectAfterAuth(sessionUser));
    } catch (err) {
      toast.apiError(err, t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  if (!isFirebaseConfigured() || !webClientId) {
    return null;
  }

  return (
    <>
      <SocialSignInButton
        accessibilityLabel={t('auth.continueWithGoogle')}
        disabled={!ready}
        loading={loading}
        onPress={() => void handlePress()}
      >
        <GoogleIcon width={22} height={22} />
      </SocialSignInButton>

      <AccountLinkingDialog
        request={linkingRequest}
        loading={loading}
        onCancel={() => setLinkingRequest(null)}
        onSubmit={handleLink}
      />
    </>
  );
}
