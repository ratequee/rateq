'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { phoneVerificationApi } from '@/lib/phone-verification-api';
import {
  confirmFirebasePhoneVerification,
  getLinkedFirebasePhoneNumber,
  isSamePhoneNumber,
  normalizePhoneNumber,
  resetFirebasePhoneVerification,
  startFirebasePhoneVerification,
} from '@/lib/firebase/phone-auth';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { ApiError } from '@/lib/api';
import {
  isFirebaseInvalidAppCredentialError,
  isFirebasePhoneAlreadyLinkedError,
  isFirebasePhoneRegionNotEnabledError,
  getFirebaseAuthErrorMessage,
} from '@/lib/firebase/errors';
import { cn } from '@/lib/utils';
import { onAuthStateChanged } from 'firebase/auth';
import { CheckCircle2, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';

const PHONE_PATTERN = /^[+]?[\d\s()-]{6,30}$/;
const RESEND_COOLDOWN_SECONDS = 60;

function getPhoneVerificationErrorMessage(
  err: unknown,
  t: (key: string) => string,
  fallbackKey: 'phoneOtpSendError' | 'phoneOtpVerifyError',
): string {
  if (isFirebasePhoneAlreadyLinkedError(err)) {
    return t('phoneAlreadyLinked');
  }
  if (isFirebasePhoneRegionNotEnabledError(err)) {
    return t('phoneRegionNotEnabled');
  }
  if (isFirebaseInvalidAppCredentialError(err)) {
    return t('phoneInvalidAppCredential');
  }
  if (err instanceof ApiError) {
    return err.message;
  }
  if (err instanceof Error && err.message) {
    return getFirebaseAuthErrorMessage(err, t(fallbackKey));
  }
  return t(fallbackKey);
}

type PhoneVerificationContext = 'reviewer' | 'company';

interface PhoneVerificationFieldProps {
  phone: string;
  onPhoneChange: (value: string) => void;
  context: PhoneVerificationContext;
  verified: boolean;
  onVerifiedChange: (verified: boolean) => void;
  onVerified?: () => void;
  error?: string;
  disabled?: boolean;
  label: string;
  fieldKey: string;
}

export function PhoneVerificationField({
  phone,
  onPhoneChange,
  context,
  verified,
  onVerifiedChange,
  onVerified,
  error,
  disabled,
  label,
  fieldKey,
}: PhoneVerificationFieldProps) {
  const t = useTranslations('profilePage');
  const ta = useTranslations('authPage');
  const recaptchaContainerId = useId().replace(/:/g, '');
  const [otpCode, setOtpCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [awaitingLinkedConfirm, setAwaitingLinkedConfirm] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [linkedFirebasePhone, setLinkedFirebasePhone] = useState<string | null>(null);
  const [editingNumber, setEditingNumber] = useState(true);
  const [recaptchaAttempt, setRecaptchaAttempt] = useState(0);

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
    const syncLinkedPhone = () => setLinkedFirebasePhone(getLinkedFirebasePhoneNumber());
    syncLinkedPhone();
    const unsubscribe = onAuthStateChanged(auth, syncLinkedPhone);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (verified) {
      setEditingNumber(false);
    }
  }, [verified]);

  const handlePhoneChange = (value: string) => {
    if (verified) return;
    onPhoneChange(value);
    onVerifiedChange(false);
    setOtpSent(false);
    setAwaitingLinkedConfirm(false);
    setOtpCode('');
    setResendCooldown(0);
    setEditingNumber(true);
    resetFirebasePhoneVerification();
  };

  const handleUseLinkedNumber = () => {
    if (!linkedFirebasePhone) return;
    handlePhoneChange(linkedFirebasePhone);
  };

  const completePhoneSync = async (normalizedPhone: string) => {
    await phoneVerificationApi.syncPhone(normalizedPhone, context);
    onVerifiedChange(true);
    setEditingNumber(false);
    setOtpSent(false);
    setAwaitingLinkedConfirm(false);
    setOtpCode('');
    setResendCooldown(0);
    onVerified?.();
    toast.success(t('phoneVerifiedSuccess'));
  };

  const recaptchaContainerElementId = `${recaptchaContainerId}-${recaptchaAttempt}`;

  const handleSendOtp = async () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      toast.error(t('errors.required'));
      return;
    }
    if (!PHONE_PATTERN.test(trimmed)) {
      toast.error(t('errors.invalidPhone'));
      return;
    }

    setSending(true);
    try {
      const nextAttempt = recaptchaAttempt + 1;
      setRecaptchaAttempt(nextAttempt);
      const { smsRequired } = await startFirebasePhoneVerification(
        trimmed,
        `${recaptchaContainerId}-${nextAttempt}`,
      );
      if (!smsRequired) {
        setOtpSent(false);
        setAwaitingLinkedConfirm(true);
        toast.success(t('phoneLinkedReadyToConfirm'));
        return;
      }
      setAwaitingLinkedConfirm(false);
      setOtpSent(true);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success(t('phoneOtpSent'));
    } catch (err) {
      toast.error(getPhoneVerificationErrorMessage(err, t, 'phoneOtpSendError'));
    } finally {
      setSending(false);
    }
  };

  const handleConfirmLinkedPhone = async () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      toast.error(t('errors.required'));
      return;
    }

    setVerifying(true);
    try {
      await completePhoneSync(normalizePhoneNumber(trimmed));
    } catch (err) {
      onVerifiedChange(false);
      toast.error(getPhoneVerificationErrorMessage(err, t, 'phoneOtpVerifyError'));
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otpCode.trim())) {
      toast.error(ta('validationOtpInvalid'));
      return;
    }

    setVerifying(true);
    try {
      await confirmFirebasePhoneVerification(otpCode.trim());
      await completePhoneSync(normalizePhoneNumber(phone));
    } catch (err) {
      onVerifiedChange(false);
      toast.error(getPhoneVerificationErrorMessage(err, t, 'phoneOtpVerifyError'));
    } finally {
      setVerifying(false);
    }
  };

  const sendButtonLabel = () => {
    if (sending) return t('phoneSendingOtp');
    if (resendCooldown > 0) return t('phoneResendIn', { seconds: resendCooldown });
    if (otpSent) return t('phoneResendOtp');
    return t('phoneSendOtp');
  };

  const canSendOtp = !disabled && !sending && resendCooldown === 0 && editingNumber;
  const showLinkedPhoneHint =
    Boolean(linkedFirebasePhone) &&
    editingNumber &&
    !verified &&
    (!phone.trim() || !isSamePhoneNumber(phone, linkedFirebasePhone!));
  const inputDisabled = disabled || (verified && !editingNumber);

  return (
    <div data-field={fieldKey} className="space-y-3">
      <div
        key={recaptchaAttempt}
        id={recaptchaContainerElementId}
        className="pointer-events-none fixed left-0 top-0 h-px w-px overflow-hidden opacity-0"
        aria-hidden
      />
      <div>
        <label htmlFor={`${fieldKey}-phone`} className="mb-1.5 block text-sm font-medium text-ink">
          {label}
          <span className="text-red-600"> *</span>
        </label>

        {showLinkedPhoneHint && linkedFirebasePhone ? (
          <div className="mb-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
            <div className="flex gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div className="space-y-2">
                <p>{t('phoneLinkedToAccountHint', { phone: linkedFirebasePhone })}</p>
                <button
                  type="button"
                  onClick={handleUseLinkedNumber}
                  className="font-medium text-brand-600 hover:text-brand-700"
                >
                  {t('phoneUseLinkedNumber')}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id={`${fieldKey}-phone`}
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder={t('phonePlaceholder')}
            className={cn(
              'h-11 flex-1',
              verified && !editingNumber && 'border-emerald-200 bg-emerald-50/50',
            )}
            disabled={inputDisabled}
            aria-invalid={Boolean(error)}
          />
          {verified && !editingNumber ? (
            <div className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {t('phoneVerifiedLabel')}
            </div>
          ) : (
            <Button
              type="button"
              variant="outline-brand"
              className="h-11 shrink-0"
              disabled={!canSendOtp}
              onClick={() => void handleSendOtp()}
            >
              {sendButtonLabel()}
            </Button>
          )}
        </div>

        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>

      {otpSent && editingNumber && !verified && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-sm text-ink-muted">{t('phoneOtpHint')}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={ta('verificationCode')}
              className="h-11 flex-1 text-center tracking-[0.3em]"
            />
            <Button
              type="button"
              className="h-11 shrink-0 bg-gold-400 text-white hover:bg-gold-500"
              disabled={verifying}
              onClick={() => void handleVerifyOtp()}
            >
              {verifying ? t('phoneVerifyingOtp') : t('phoneVerifyOtp')}
            </Button>
          </div>
        </div>
      )}

      {awaitingLinkedConfirm && editingNumber && !verified && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
          <p className="mb-3 text-sm text-sky-950">{t('phoneConfirmLinkedHint')}</p>
          <Button
            type="button"
            className="h-11 bg-gold-400 text-white hover:bg-gold-500"
            disabled={verifying}
            onClick={() => void handleConfirmLinkedPhone()}
          >
            {verifying ? t('phoneVerifyingOtp') : t('phoneConfirmLinked')}
          </Button>
        </div>
      )}
    </div>
  );
}
