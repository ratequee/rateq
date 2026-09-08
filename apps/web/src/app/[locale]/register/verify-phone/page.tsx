'use client';

import { AuthLayout } from '@/components/auth/auth-layout';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useRouter } from '@/i18n/routing';
import { phoneVerificationApi } from '@/lib/phone-verification-api';
import {
  confirmFirebasePhoneVerification,
  getLinkedFirebasePhoneNumber,
  isSamePhoneNumber,
  resetFirebasePhoneVerification,
  startFirebasePhoneVerification,
} from '@/lib/firebase/phone-auth';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { ApiError } from '@/lib/api';
import {
  getFirebaseAuthErrorMessage,
  isFirebaseInvalidAppCredentialError,
  isFirebasePhoneAlreadyLinkedError,
  isFirebasePhoneRegionNotEnabledError,
} from '@/lib/firebase/errors';
import {
  extractQatarPhoneDigits,
  formatQatarPhoneForSubmit,
  isValidQatarPhoneDigits,
} from '@/lib/qatar-phone';
import { getPendingRegistration, markPendingPhoneVerified } from '@/lib/pending-registration';
import { ensureValidAccessToken } from '@/lib/auth-session';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';

const RESEND_COOLDOWN_SECONDS = 60;

function getPhoneErrorMessage(
  err: unknown,
  t: (key: string) => string,
  fallbackKey: 'phoneOtpSendError' | 'phoneOtpVerifyError',
): string {
  if (isFirebasePhoneAlreadyLinkedError(err)) return t('phoneAlreadyLinked');
  if (isFirebasePhoneRegionNotEnabledError(err)) return t('phoneRegionNotEnabled');
  if (isFirebaseInvalidAppCredentialError(err)) return t('phoneInvalidAppCredential');
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) {
    return getFirebaseAuthErrorMessage(err, t(fallbackKey));
  }
  return t(fallbackKey);
}

export default function RegisterVerifyPhonePage() {
  const t = useTranslations('profilePage');
  const ta = useTranslations('authPage');
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/register';
  const context = (searchParams.get('context') as 'reviewer' | 'company' | null) ?? null;
  const syncToProfile = searchParams.get('sync') === '1' || Boolean(context);
  const isProfilePhoneFlow =
    nextPath.includes('complete-profile') || syncToProfile || Boolean(context);
  const fallbackPath = isProfilePhoneFlow
    ? `/check-email?needPhone=1${context ? `&context=${context}` : ''}`
    : '/register';

  const pending = getPendingRegistration();
  const phoneFromQuery = searchParams.get('phone') ?? '';
  const initialPhone =
    pending?.phone ||
    (phoneFromQuery ? extractQatarPhoneDigits(phoneFromQuery) : '') ||
    extractQatarPhoneDigits(getLinkedFirebasePhoneNumber() ?? '');

  const recaptchaContainerId = useId().replace(/:/g, '');
  const [phone] = useState(initialPhone);
  const [otpCode, setOtpCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [recaptchaAttempt, setRecaptchaAttempt] = useState(0);

  useEffect(() => {
    if (!isValidQatarPhoneDigits(phone)) {
      router.replace(fallbackPath);
    }
  }, [phone, router, fallbackPath]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timerId = window.setInterval(() => {
      setResendCooldown((seconds) => (seconds <= 1 ? 0 : seconds - 1));
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [resendCooldown]);

  useEffect(() => {
    return () => {
      resetFirebasePhoneVerification();
    };
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth.currentUser) {
      toast.error(ta('phoneVerifySignInRequired'));
      router.replace(isProfilePhoneFlow ? '/login' : '/register');
      return;
    }

    const linked = getLinkedFirebasePhoneNumber();
    if (linked && phone && isSamePhoneNumber(linked, formatQatarPhoneForSubmit(phone))) {
      void completeVerification(formatQatarPhoneForSubmit(phone));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const completeVerification = async (normalizedPhone: string) => {
    markPendingPhoneVerified(extractQatarPhoneDigits(normalizedPhone));

    if (syncToProfile) {
      const token = await ensureValidAccessToken();
      if (token) {
        await phoneVerificationApi.syncPhone(normalizedPhone, context ?? 'reviewer');
      }
    }

    toast.success(t('phoneVerifiedSuccess'));
    router.replace(nextPath);
  };

  const handleSendOtp = async () => {
    if (!isValidQatarPhoneDigits(phone)) {
      toast.error(ta('validationPhoneInvalid'));
      return;
    }

    setSending(true);
    try {
      const normalizedPhone = formatQatarPhoneForSubmit(phone);
      const result = await startFirebasePhoneVerification(
        normalizedPhone,
        `recaptcha-${recaptchaContainerId}-${recaptchaAttempt}`,
      );

      if (!result.smsRequired) {
        await completeVerification(normalizedPhone);
        return;
      }

      setOtpSent(true);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success(t('phoneOtpSent'));
    } catch (err) {
      setRecaptchaAttempt((n) => n + 1);
      toast.error(getPhoneErrorMessage(err, t, 'phoneOtpSendError'));
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.trim().length < 6) {
      toast.error(t('phoneOtpVerifyError'));
      return;
    }

    setVerifying(true);
    try {
      await confirmFirebasePhoneVerification(otpCode.trim());
      await completeVerification(formatQatarPhoneForSubmit(phone));
    } catch (err) {
      toast.error(getPhoneErrorMessage(err, t, 'phoneOtpVerifyError'));
    } finally {
      setVerifying(false);
    }
  };

  const displayPhone = phone ? formatQatarPhoneForSubmit(phone) : '';

  return (
    <AuthLayout variant="register">
      <div>
        <div className="flex flex-col items-center justify-between">
          <div className="mb-4">
            <Link href="/">
              <Logo variant="auto" />
            </Link>
          </div>
          <h2 className="text-2xl font-bold text-ink dark:text-white">{ta('verifyPhoneTitle')}</h2>
          <p className="mt-2 text-center text-sm text-ink-muted dark:text-white/85">
            {ta('verifyPhoneSubtitle', { phone: displayPhone || '—' })}
          </p>
        </div>

        <div
          key={recaptchaAttempt}
          id={`recaptcha-${recaptchaContainerId}-${recaptchaAttempt}`}
          className="pointer-events-none fixed left-0 top-0 h-px w-px overflow-hidden opacity-0"
          aria-hidden
        />

        <div className="mt-8 space-y-5">
          {!otpSent ? (
            <Button
              type="button"
              size="lg"
              className="w-full bg-gold-400 text-white hover:bg-gold-500"
              disabled={sending || !phone}
              onClick={() => void handleSendOtp()}
            >
              {sending ? t('phoneSendingOtp') : ta('sendPhoneCode')}
            </Button>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink dark:text-white">
                  {ta('verificationCode')}
                </label>
                <Input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={ta('verificationCode')}
                  className="h-11 text-center tracking-[0.3em] dark:border-dm-border dark:bg-dm-elevated"
                />
              </div>
              <Button
                type="button"
                size="lg"
                className="w-full bg-gold-400 text-white hover:bg-gold-500"
                disabled={verifying}
                onClick={() => void handleVerifyOtp()}
              >
                {verifying ? t('phoneVerifyingOtp') : t('phoneVerifyOtp')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={sending || resendCooldown > 0}
                onClick={() => void handleSendOtp()}
              >
                {resendCooldown > 0
                  ? ta('resendCodeIn', { seconds: resendCooldown })
                  : ta('resendPhoneCode')}
              </Button>
            </>
          )}

          <p className="text-center text-sm text-ink-muted dark:text-white/85">
            <button
              type="button"
              className="font-semibold text-brand-500 hover:underline"
              onClick={() => router.replace(fallbackPath)}
            >
              {isProfilePhoneFlow ? ta('backToVerification') : ta('backToRegister')}
            </button>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
