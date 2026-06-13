'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { phoneVerificationApi } from '@/lib/phone-verification-api';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const PHONE_PATTERN = /^[+]?[\d\s()-]{6,30}$/;
const RESEND_COOLDOWN_SECONDS = 60;

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
  const [otpCode, setOtpCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timerId = window.setInterval(() => {
      setResendCooldown((seconds) => (seconds <= 1 ? 0 : seconds - 1));
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [resendCooldown]);

  const handlePhoneChange = (value: string) => {
    onPhoneChange(value);
    onVerifiedChange(false);
    setOtpSent(false);
    setOtpCode('');
    setResendCooldown(0);
  };

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
      await phoneVerificationApi.sendOtp(trimmed, context);
      setOtpSent(true);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success(t('phoneOtpSent'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('phoneOtpSendError'));
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otpCode.trim())) {
      toast.error(ta('validationOtpInvalid'));
      return;
    }

    setVerifying(true);
    try {
      await phoneVerificationApi.verifyOtp(otpCode.trim(), context);
      onVerifiedChange(true);
      setOtpSent(false);
      setOtpCode('');
      setResendCooldown(0);
      onVerified?.();
      toast.success(t('phoneVerifiedSuccess'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('phoneOtpVerifyError'));
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

  const canSendOtp = !disabled && !sending && resendCooldown === 0;

  return (
    <div data-field={fieldKey} className="space-y-3">
      <div>
        <label htmlFor={`${fieldKey}-phone`} className="mb-1.5 block text-sm font-medium text-ink">
          {label}
          <span className="text-red-600"> *</span>
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id={`${fieldKey}-phone`}
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder={t('phonePlaceholder')}
            className={cn('h-11 flex-1', verified && 'border-emerald-200 bg-emerald-50/50')}
            disabled={disabled || verified}
            aria-invalid={Boolean(error)}
          />
          {verified ? (
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

      {otpSent && !verified && (
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
    </div>
  );
}
