'use client';

import type { AuthenticatedUser } from '@rateq/types';
import { useAuth } from '@/components/providers/auth-provider';
import { isAccountDeactivatedApiError } from '@/lib/account-status';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/errors';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';

interface GoogleSignInButtonProps {
  onSuccess: (user: AuthenticatedUser) => void | Promise<void>;
}

export function GoogleSignInButton({ onSuccess }: GoogleSignInButtonProps) {
  const tp = useTranslations('authPage');
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      toast.success(tp('loginSuccess'));
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
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={tp('continueWithGoogle')}
      className="inline-flex items-center justify-center rounded-full transition-opacity hover:opacity-80 disabled:opacity-50"
    >
      <Image src="/images/google.svg" alt="" width={22} height={22} />
    </button>
  );
}
