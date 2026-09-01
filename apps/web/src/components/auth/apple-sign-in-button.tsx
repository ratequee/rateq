'use client';

import type { AuthenticatedUser } from '@rateq/types';
import { AccountLinkingDialog } from '@/components/auth/account-linking-dialog';
import { useAuth } from '@/components/providers/auth-provider';
import { isAccountDeactivatedApiError } from '@/lib/account-status';
import { AccountLinkingRequiredError, isAccountLinkingRequiredError } from '@/lib/auth-flow-errors';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/errors';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';

interface AppleSignInButtonProps {
  onSuccess: (user: AuthenticatedUser) => void | Promise<void>;
}

export function AppleSignInButton({ onSuccess }: AppleSignInButtonProps) {
  const tp = useTranslations('authPage');
  const { loginWithApple, linkOAuthWithPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [linkingRequest, setLinkingRequest] = useState<AccountLinkingRequiredError | null>(null);

  const handleClick = async () => {
    setLoading(true);
    try {
      const user = await loginWithApple();
      toast.success(tp('loginSuccess'));
      await onSuccess(user);
    } catch (error) {
      if (isAccountLinkingRequiredError(error)) {
        setLinkingRequest(error);
        return;
      }
      if (isAccountDeactivatedApiError(error)) {
        toast.error(tp('accountDeactivated'));
        return;
      }
      toast.error(getFirebaseAuthErrorMessage(error, tp('loginError')));
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async (password: string) => {
    if (!linkingRequest) return;

    setLoading(true);
    try {
      const user = await linkOAuthWithPassword(linkingRequest.email, password);
      setLinkingRequest(null);
      toast.success(tp('linkAccountSuccess'));
      await onSuccess(user);
    } catch (error) {
      if (isAccountDeactivatedApiError(error)) {
        toast.error(tp('accountDeactivated'));
        return;
      }
      toast.error(getFirebaseAuthErrorMessage(error, tp('loginError')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={loading}
        aria-label={tp('continueWithApple')}
        className="inline-flex items-center justify-center rounded-full text-ink transition-opacity hover:opacity-80 disabled:opacity-50 dark:text-white"
      >
        <Image src="/images/apple.svg" alt="" width={22} height={22} className="dark:invert" />
      </button>

      <AccountLinkingDialog
        request={linkingRequest}
        loading={loading}
        onCancel={() => setLinkingRequest(null)}
        onSubmit={handleLink}
      />
    </>
  );
}
