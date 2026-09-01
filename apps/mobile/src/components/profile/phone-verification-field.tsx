import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QatarPhoneInput } from '@/components/ui/qatar-phone-input';
import { useAppToast } from '@/hooks/use-app-toast';
import { onboardingApi } from '@/lib/api';
import {
  confirmFirebasePhoneVerification,
  getLinkedFirebasePhoneNumber,
  isSamePhoneNumber,
  normalizePhoneNumber,
  resetFirebasePhoneVerification,
  startFirebasePhoneVerification,
} from '@/lib/firebase/phone-auth';
import { getPhoneVerificationErrorMessage } from '@/lib/firebase/phone-errors';
import { getFirebaseWebConfig } from '@/lib/firebase/client';
import {
  extractQatarPhoneDigits,
  formatQatarPhoneForSubmit,
  isValidQatarPhoneDigits,
} from '@/lib/qatar-phone';
import { FirebaseRecaptchaVerifierModal } from '@/components/firebase/firebase-recaptcha-verifier-modal';
import type { FirebaseRecaptchaVerifierModalHandle } from '@/components/firebase/firebase-recaptcha-verifier-modal';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { getFontFamily } from '@/i18n';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/client';

const RESEND_COOLDOWN_SECONDS = 60;

type PhoneVerificationContext = 'reviewer' | 'company';

interface PhoneVerificationFieldProps {
  phone: string;
  onPhoneChange: (value: string) => void;
  context: PhoneVerificationContext;
  verified: boolean;
  onVerifiedChange: (verified: boolean) => void;
  error?: string;
  disabled?: boolean;
  label: string;
}

export function PhoneVerificationField({
  phone,
  onPhoneChange,
  context,
  verified,
  onVerifiedChange,
  error,
  disabled,
  label,
}: PhoneVerificationFieldProps) {
  const { t } = useTranslation();
  const toast = useAppToast();
  const recaptchaRef = useRef<FirebaseRecaptchaVerifierModalHandle>(null);
  const [otpCode, setOtpCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [awaitingLinkedConfirm, setAwaitingLinkedConfirm] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [linkedFirebasePhone, setLinkedFirebasePhone] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timerId = setInterval(() => {
      setResendCooldown((seconds) => (seconds <= 1 ? 0 : seconds - 1));
    }, 1000);
    return () => clearInterval(timerId);
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
    return onAuthStateChanged(auth, syncLinkedPhone);
  }, []);

  const handlePhoneChange = (value: string) => {
    if (verified) return;
    onPhoneChange(value);
    onVerifiedChange(false);
    setOtpSent(false);
    setAwaitingLinkedConfirm(false);
    setOtpCode('');
    setResendCooldown(0);
    resetFirebasePhoneVerification();
  };

  const completePhoneSync = async (normalizedPhone: string) => {
    await onboardingApi.syncPhone(normalizedPhone, context);
    onVerifiedChange(true);
    setOtpSent(false);
    setAwaitingLinkedConfirm(false);
    setOtpCode('');
    setResendCooldown(0);
    toast.success(t('onboarding.phoneVerifiedMessage'), t('onboarding.phoneVerifiedTitle'));
  };

  const handleSendOtp = async () => {
    if (!isValidQatarPhoneDigits(phone)) {
      toast.error(t('onboarding.phoneInvalid'));
      return;
    }

    const verifier = recaptchaRef.current;
    if (!verifier) {
      toast.error(t('onboarding.phoneRecaptchaUnavailable'));
      return;
    }

    setSending(true);
    try {
      const { smsRequired } = await startFirebasePhoneVerification(
        normalizePhoneNumber(phone),
        verifier,
      );
      if (!smsRequired) {
        setOtpSent(false);
        setAwaitingLinkedConfirm(true);
        return;
      }
      setAwaitingLinkedConfirm(false);
      setOtpSent(true);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success(t('onboarding.phoneOtpSentMessage'), t('onboarding.phoneOtpSentTitle'));
    } catch (err) {
      toast.error(
        getPhoneVerificationErrorMessage(
          err,
          t('onboarding.phoneOtpSendError'),
          t('onboarding.phoneAlreadyLinked'),
          t('onboarding.phoneRegionNotEnabled'),
          t('onboarding.phoneInvalidCredential'),
        ),
      );
    } finally {
      setSending(false);
    }
  };

  const handleConfirmLinkedPhone = async () => {
    setVerifying(true);
    try {
      await completePhoneSync(normalizePhoneNumber(phone));
    } catch (err) {
      onVerifiedChange(false);
      toast.apiError(err, t('onboarding.phoneOtpVerifyError'));
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otpCode.trim())) {
      toast.error(t('onboarding.phoneOtpInvalid'));
      return;
    }

    setVerifying(true);
    try {
      await confirmFirebasePhoneVerification(otpCode.trim());
      await completePhoneSync(normalizePhoneNumber(phone));
    } catch (err) {
      onVerifiedChange(false);
      toast.error(
        getPhoneVerificationErrorMessage(
          err,
          t('onboarding.phoneOtpVerifyError'),
          t('onboarding.phoneAlreadyLinked'),
          t('onboarding.phoneRegionNotEnabled'),
          t('onboarding.phoneInvalidCredential'),
        ),
      );
    } finally {
      setVerifying(false);
    }
  };

  const sendButtonLabel = () => {
    if (sending) return t('onboarding.phoneSendingOtp');
    if (resendCooldown > 0) return t('onboarding.phoneResendIn', { seconds: resendCooldown });
    if (otpSent) return t('onboarding.phoneResendOtp');
    return t('onboarding.phoneSendOtp');
  };

  const canSendOtp = !disabled && !sending && resendCooldown === 0 && !verified;
  const showLinkedPhoneHint =
    Boolean(linkedFirebasePhone) &&
    !verified &&
    (!phone.trim() || !isSamePhoneNumber(formatQatarPhoneForSubmit(phone), linkedFirebasePhone!));

  return (
    <View>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaRef}
        firebaseConfig={getFirebaseWebConfig()}
        attemptInvisibleVerification
      />

      <Label required>{label}</Label>

      {showLinkedPhoneHint && linkedFirebasePhone ? (
        <View className="mb-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 dark:border-sky-900/60 dark:bg-sky-950/30">
          <Text
            className="text-sm text-sky-950 dark:text-sky-100"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {t('onboarding.phoneLinkedHint', { phone: linkedFirebasePhone })}
          </Text>
          <Text
            className="mt-2 text-sm font-semibold text-brand-500"
            style={{ fontFamily: getFontFamily('semibold') }}
            onPress={() => handlePhoneChange(extractQatarPhoneDigits(linkedFirebasePhone))}
          >
            {t('onboarding.phoneUseLinkedNumber')}
          </Text>
        </View>
      ) : null}

      <View className="flex-row items-start gap-2">
        <QatarPhoneInput
          value={phone}
          onChange={handlePhoneChange}
          editable={!disabled && !verified}
          className="flex-1"
        />
        {verified ? (
          <View className="h-12 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <Ionicons name="checkmark-circle" size={20} color="#059669" />
          </View>
        ) : (
          <Button
            title={sendButtonLabel()}
            variant="outline"
            size="md"
            className="h-12 px-3"
            disabled={!canSendOtp}
            onPress={() => void handleSendOtp()}
          />
        )}
      </View>

      {error ? (
        <Text
          className="mt-1 text-sm text-red-500"
          style={{ fontFamily: getFontFamily('regular') }}
        >
          {error}
        </Text>
      ) : null}

      {otpSent && !verified ? (
        <View className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-dm-border dark:bg-dm-elevated">
          <Text
            className="mb-3 text-sm text-ink-muted dark:text-white/80"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {t('onboarding.phoneOtpHint')}
          </Text>
          <Input
            value={otpCode}
            onChangeText={(text) => setOtpCode(text.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            placeholder={t('onboarding.phoneOtpPlaceholder')}
            className="text-center tracking-widest"
          />
          <Button
            title={verifying ? t('onboarding.phoneVerifyingOtp') : t('onboarding.phoneVerifyOtp')}
            variant="gold"
            className="mt-3 w-full"
            disabled={verifying}
            onPress={() => void handleVerifyOtp()}
          />
        </View>
      ) : null}

      {awaitingLinkedConfirm && !verified ? (
        <View className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900/60 dark:bg-sky-950/30">
          <Text
            className="mb-3 text-sm text-sky-950 dark:text-sky-100"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {t('onboarding.phoneConfirmLinkedHint')}
          </Text>
          <Button
            title={
              verifying ? t('onboarding.phoneVerifyingOtp') : t('onboarding.phoneConfirmLinked')
            }
            variant="gold"
            disabled={verifying}
            onPress={() => void handleConfirmLinkedPhone()}
          />
        </View>
      ) : null}
    </View>
  );
}
