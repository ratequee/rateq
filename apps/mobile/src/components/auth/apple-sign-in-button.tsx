import AppleIcon from '../../../assets/images/apple.svg';
import { AccountLinkingDialog } from '@/components/auth/account-linking-dialog';
import { SocialSignInButton } from '@/components/auth/social-sign-in-button';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { useRedirectAfterAuth } from '@/hooks/use-redirect-after-auth';
import { useAppToast } from '@/hooks/use-app-toast';
import { AccountLinkingRequiredError, isAccountLinkingRequiredError } from '@/lib/auth-flow-errors';
import { firebaseSignInWithApple } from '@/lib/firebase/apple-auth';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/errors';
import { isFirebaseConfigured } from '@/lib/firebase/client';
import { ApiError } from '@/lib/api';
import type { AuthenticatedUser } from '@rateq/types';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

interface AppleSignInButtonProps {
  onSuccess?: (user: AuthenticatedUser) => void | Promise<void>;
}

export function AppleSignInButton({ onSuccess }: AppleSignInButtonProps) {
  const { t } = useTranslation();
  const { resolved } = useTheme();
  const { completeOAuthSession, linkOAuthWithPassword } = useAuth();
  const redirectAfterAuth = useRedirectAfterAuth();
  const toast = useAppToast();
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(false);
  const [linkingRequest, setLinkingRequest] = useState<AccountLinkingRequiredError | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    void AppleAuthentication.isAvailableAsync().then(setAvailable);
  }, []);

  const handlePress = async () => {
    setLoading(true);
    try {
      await firebaseSignInWithApple();
      const sessionUser = await completeOAuthSession();
      await (onSuccess ? onSuccess(sessionUser) : redirectAfterAuth(sessionUser));
    } catch (err) {
      if (isAccountLinkingRequiredError(err)) {
        setLinkingRequest(err);
        return;
      }
      if (
        err instanceof Error &&
        'code' in err &&
        (err as { code?: string }).code === 'ERR_REQUEST_CANCELED'
      ) {
        return;
      }
      toast.error(
        err instanceof ApiError
          ? err.message
          : getFirebaseAuthErrorMessage(err, t('auth.loginError')),
      );
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
      toast.error(
        err instanceof ApiError
          ? err.message
          : getFirebaseAuthErrorMessage(err, t('auth.loginError')),
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isFirebaseConfigured() || Platform.OS !== 'ios' || !available) {
    return null;
  }

  return (
    <>
      <SocialSignInButton
        accessibilityLabel={t('auth.continueWithApple')}
        loading={loading}
        onPress={() => void handlePress()}
      >
        <AppleIcon width={22} height={22} color={resolved === 'dark' ? '#FFFFFF' : '#000000'} />
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
