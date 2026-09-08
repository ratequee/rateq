import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthFieldGroup } from '@/components/auth/auth-field-group';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { FirebaseRecaptchaVerifierModal } from '@/components/firebase/firebase-recaptcha-verifier-modal';
import type { FirebaseRecaptchaVerifierModalHandle } from '@/components/firebase/firebase-recaptcha-verifier-modal';
import { useAppToast } from '@/hooks/use-app-toast';
import { onboardingApi } from '@/lib/api';
import { getFirebaseAuth, getFirebaseWebConfig } from '@/lib/firebase/client';
import {
  confirmFirebasePhoneVerification,
  getLinkedFirebasePhoneNumber,
  isSamePhoneNumber,
  normalizePhoneNumber,
  resetFirebasePhoneVerification,
  startFirebasePhoneVerification,
} from '@/lib/firebase/phone-auth';
import { getPhoneVerificationErrorMessage } from '@/lib/firebase/phone-errors';
import { getPendingRegistration, markPendingPhoneVerified } from '@/lib/pending-registration';
import {
  extractQatarPhoneDigits,
  formatQatarPhoneForSubmit,
  isValidQatarPhoneDigits,
} from '@/lib/qatar-phone';
import { getFontFamily } from '@/i18n';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyPhoneScreen() {
  const { t } = useTranslation();
  const toast = useAppToast();
  const router = useRouter();
  const params = useLocalSearchParams<{
    phone?: string;
    next?: string;
    context?: string;
    sync?: string;
  }>();

  const nextPath = params.next || '/(auth)/register';
  const context =
    params.context === 'company' || params.context === 'reviewer' ? params.context : null;
  const syncToProfile = params.sync === '1' || Boolean(context);

  const [phone, setPhone] = useState('');
  const [ready, setReady] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const recaptchaRef = useRef<FirebaseRecaptchaVerifierModalHandle>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    void (async () => {
      const pending = await getPendingRegistration();
      const phoneFromQuery = typeof params.phone === 'string' ? params.phone : '';
      const linked = getLinkedFirebasePhoneNumber();
      const initialPhone =
        pending?.phone ||
        (phoneFromQuery ? extractQatarPhoneDigits(phoneFromQuery) : '') ||
        extractQatarPhoneDigits(linked ?? '');

      if (!isValidQatarPhoneDigits(initialPhone)) {
        router.replace('/(auth)/register');
        return;
      }

      setPhone(initialPhone);
      setReady(true);
    })();
  }, [params.phone, router]);

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

  const completeVerification = async (normalizedPhone: string) => {
    if (completedRef.current) return;
    completedRef.current = true;

    await markPendingPhoneVerified(extractQatarPhoneDigits(normalizedPhone));

    if (syncToProfile) {
      try {
        await onboardingApi.syncPhone(normalizedPhone, context ?? 'reviewer');
      } catch (err) {
        completedRef.current = false;
        throw err;
      }
    }

    toast.success(t('onboarding.phoneVerifiedMessage'), t('onboarding.phoneVerifiedTitle'));
    router.replace(nextPath as Href);
  };

  useEffect(() => {
    if (!ready || !phone) return;

    const auth = getFirebaseAuth();
    if (!auth.currentUser) {
      toast.error(t('auth.phoneVerifySignInRequired'));
      router.replace('/(auth)/register');
      return;
    }

    const linked = getLinkedFirebasePhoneNumber();
    if (linked && isSamePhoneNumber(linked, formatQatarPhoneForSubmit(phone))) {
      void completeVerification(formatQatarPhoneForSubmit(phone)).catch((err) => {
        toast.error(
          getPhoneVerificationErrorMessage(
            err,
            t('onboarding.phoneOtpVerifyError'),
            t('onboarding.phoneAlreadyLinked'),
            t('onboarding.phoneRegionNotEnabled'),
            t('onboarding.phoneInvalidCredential'),
          ),
        );
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when ready
  }, [ready, phone]);

  const handleSendOtp = async () => {
    if (!isValidQatarPhoneDigits(phone)) {
      toast.error(t('auth.validationPhoneInvalid'));
      return;
    }

    const verifier = recaptchaRef.current;
    if (!verifier) {
      toast.error(t('onboarding.phoneRecaptchaUnavailable'));
      return;
    }

    setSending(true);
    try {
      const normalizedPhone = formatQatarPhoneForSubmit(phone);
      const result = await startFirebasePhoneVerification(normalizePhoneNumber(phone), verifier);

      if (!result.smsRequired) {
        await completeVerification(normalizedPhone);
        return;
      }

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

  const handleVerifyOtp = async () => {
    if (otpCode.trim().length < 6) {
      toast.error(t('onboarding.phoneOtpInvalid'));
      return;
    }

    setVerifying(true);
    try {
      await confirmFirebasePhoneVerification(otpCode.trim());
      await completeVerification(formatQatarPhoneForSubmit(phone));
    } catch (err) {
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

  const displayPhone = phone ? formatQatarPhoneForSubmit(phone) : '—';
  const backHref = nextPath.startsWith('/(onboarding)')
    ? ('/(onboarding)/complete-profile' as const)
    : ('/(auth)/register' as const);

  if (!ready) {
    return null;
  }

  return (
    <AuthScreenLayout
      title={t('auth.verifyPhoneTitle')}
      subtitle={t('auth.verifyPhoneSubtitle', { phone: displayPhone })}
      footer={
        <Pressable onPress={() => router.replace(backHref)} accessibilityRole="button">
          <Text
            className="text-center text-sm font-semibold text-brand-500 dark:text-gold-300"
            style={{ fontFamily: getFontFamily('semibold') }}
          >
            {nextPath.startsWith('/(onboarding)')
              ? t('onboarding.previousStep')
              : t('auth.backToRegister')}
          </Text>
        </Pressable>
      }
    >
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaRef}
        firebaseConfig={getFirebaseWebConfig()}
        attemptInvisibleVerification
      />

      <View className="gap-5">
        {!otpSent ? (
          <Button
            title={sending ? t('onboarding.phoneSendingOtp') : t('auth.sendPhoneCode')}
            variant="gold"
            size="lg"
            className="w-full rounded-2xl"
            disabled={sending || !phone}
            loading={sending}
            onPress={() => void handleSendOtp()}
          />
        ) : (
          <>
            <AuthFieldGroup label={t('auth.verificationCode')}>
              <Input
                value={otpCode}
                onChangeText={(text) => setOtpCode(text.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                placeholder={t('auth.verificationCode')}
                className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-center tracking-widest dark:border-dm-border dark:bg-dm-elevated"
              />
            </AuthFieldGroup>

            <Button
              title={verifying ? t('onboarding.phoneVerifyingOtp') : t('onboarding.phoneVerifyOtp')}
              variant="gold"
              size="lg"
              className="w-full rounded-2xl"
              disabled={verifying}
              loading={verifying}
              onPress={() => void handleVerifyOtp()}
            />

            <Button
              title={
                resendCooldown > 0
                  ? t('auth.resendCodeIn', { seconds: resendCooldown })
                  : t('auth.resendPhoneCode')
              }
              variant="outline"
              size="lg"
              className="w-full rounded-2xl"
              disabled={sending || resendCooldown > 0}
              onPress={() => void handleSendOtp()}
            />
          </>
        )}
      </View>
    </AuthScreenLayout>
  );
}
