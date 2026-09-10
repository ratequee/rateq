import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthFieldGroup } from '@/components/auth/auth-field-group';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { useAppToast } from '@/hooks/use-app-toast';
import { onboardingApi } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { ensureFirebaseUser } from '@/lib/firebase/ensure-user';
import {
  confirmFirebasePhoneVerification,
  getLinkedFirebasePhoneNumber,
  isSamePhoneNumber,
  normalizePhoneNumber,
  resetFirebasePhoneVerification,
  startFirebasePhoneVerification,
} from '@/lib/firebase/phone-auth';
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
  const { user, refreshSession, patchSessionUser } = useAuth();
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
  const isProfilePhoneFlow =
    (typeof nextPath === 'string' && nextPath.includes('complete-profile')) ||
    syncToProfile ||
    Boolean(context);
  const fallbackHref = (
    isProfilePhoneFlow
      ? `/(auth)/check-email?needPhone=1${context ? `&context=${context}` : ''}`
      : '/(auth)/register'
  ) as Href;

  const [phone, setPhone] = useState('');
  const [ready, setReady] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    void (async () => {
      const pending = await getPendingRegistration();
      const rawPhoneParam = params.phone;
      const phoneFromQuery = Array.isArray(rawPhoneParam)
        ? (rawPhoneParam[0] ?? '')
        : typeof rawPhoneParam === 'string'
          ? rawPhoneParam
          : '';
      const linked = getLinkedFirebasePhoneNumber();
      const initialPhone =
        (phoneFromQuery ? extractQatarPhoneDigits(decodeURIComponent(phoneFromQuery)) : '') ||
        pending?.phone ||
        extractQatarPhoneDigits(linked ?? '');

      if (!isValidQatarPhoneDigits(initialPhone)) {
        toast.error(t('onboarding.phoneInvalid'));
        router.replace(fallbackHref);
        return;
      }

      setPhone(initialPhone);
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once from route params
  }, [params.phone]);

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

    // Sync whenever we have a RateQ session (profile hub or post-login retry).
    if (syncToProfile || user) {
      try {
        await onboardingApi.syncPhone(normalizedPhone, context ?? 'reviewer');
        const refreshed = await refreshSession();
        if (!refreshed?.phoneVerified) {
          await patchSessionUser({ phone: normalizedPhone, phoneVerified: true });
        }
      } catch (err) {
        completedRef.current = false;
        throw err;
      }
    }

    toast.success(t('onboarding.phoneVerifiedMessage'), t('onboarding.phoneVerifiedTitle'));

    // Logged-in users always continue onboarding; registration flow returns to register.
    const destination = (
      user || isProfilePhoneFlow ? '/(onboarding)/complete-profile' : nextPath
    ) as Href;
    router.replace(destination);
  };

  useEffect(() => {
    if (!ready || !phone) return;

    void (async () => {
      try {
        await ensureFirebaseUser();
      } catch {
        toast.error(t('auth.phoneVerifySignInRequired'));
        router.replace(fallbackHref);
        return;
      }

      const auth = getFirebaseAuth();
      if (!auth.currentUser) {
        toast.error(t('auth.phoneVerifySignInRequired'));
        router.replace(fallbackHref);
        return;
      }

      const linked = getLinkedFirebasePhoneNumber();
      if (linked && isSamePhoneNumber(linked, formatQatarPhoneForSubmit(phone))) {
        void completeVerification(formatQatarPhoneForSubmit(phone)).catch((err) => {
          toast.apiError(err, t('onboarding.phoneOtpVerifyError'));
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when ready
  }, [ready, phone]);

  const handleSendOtp = async () => {
    if (!isValidQatarPhoneDigits(phone)) {
      toast.error(t('auth.validationPhoneInvalid'));
      return;
    }

    setSending(true);
    try {
      const normalizedPhone = formatQatarPhoneForSubmit(phone);
      const result = await startFirebasePhoneVerification(normalizePhoneNumber(phone));

      if (!result.smsRequired) {
        await completeVerification(normalizedPhone);
        return;
      }

      setOtpSent(true);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success(t('onboarding.phoneOtpSentMessage'), t('onboarding.phoneOtpSentTitle'));
    } catch (err) {
      toast.apiError(err, t('onboarding.phoneOtpSendError'));
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
      toast.apiError(err, t('onboarding.phoneOtpVerifyError'));
    } finally {
      setVerifying(false);
    }
  };

  const displayPhone = phone ? formatQatarPhoneForSubmit(phone) : '—';
  const backHref = fallbackHref;

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
            {isProfilePhoneFlow ? t('auth.backToVerification') : t('auth.backToRegister')}
          </Text>
        </Pressable>
      }
    >
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
