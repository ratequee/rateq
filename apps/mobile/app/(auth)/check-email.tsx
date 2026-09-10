import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/input';
import { QatarPhoneInput } from '@/components/ui/qatar-phone-input';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { useAuth } from '@/context/auth-context';
import { useProfile } from '@/context/profile-context';
import { getLinkedFirebasePhoneNumber } from '@/lib/firebase/phone-auth';
import {
  formatQatarPhoneForSubmit,
  isValidQatarPhoneDigits,
  sanitizeQatarPhoneDigits,
} from '@/lib/qatar-phone';
import { validateAuthFields } from '@/lib/validation/auth-fields';
import { useAppToast } from '@/hooks/use-app-toast';
import { resolveUserErrorKey } from '@rateq/utils';
import { getFontFamily } from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export default function CheckEmailScreen() {
  const { t } = useTranslation();
  const { user, resendVerificationEmail } = useAuth();
  const { onboarding } = useProfile();
  const router = useRouter();
  const params = useLocalSearchParams<{
    email?: string;
    needPhone?: string;
    context?: string;
  }>();
  const toast = useAppToast();

  const emailParam = typeof params.email === 'string' ? params.email : (user?.email ?? '');
  const forceNeedPhone = params.needPhone === '1';
  const phoneContext =
    params.context === 'company' || params.context === 'reviewer' ? params.context : 'reviewer';

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [linkedPhone, setLinkedPhone] = useState<string | null>(null);

  useEffect(() => {
    setLinkedPhone(getLinkedFirebasePhoneNumber());
  }, [user, onboarding]);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  const hasProfilePhone = Boolean(onboarding?.reviewerProfile?.phone || onboarding?.company?.phone);
  const phoneVerified = Boolean(linkedPhone || hasProfilePhone);
  const needsEmailVerification = !user || !user.isVerified;
  const needsPhoneVerification = useMemo(() => {
    if (forceNeedPhone && !phoneVerified) return true;
    if (!user?.isVerified) return false;
    if (onboarding?.isProfileComplete) return false;
    return !phoneVerified;
  }, [forceNeedPhone, phoneVerified, user?.isVerified, onboarding?.isProfileComplete]);

  const phoneDigits = sanitizeQatarPhoneDigits(phone);
  const phoneIsValid = isValidQatarPhoneDigits(phoneDigits);

  const validationMessages = useMemo(
    () => ({
      emailRequired: t('auth.validationEmailRequired'),
      emailInvalid: t('auth.validationEmailInvalid'),
      passwordRequired: t('auth.validationPasswordRequired'),
      passwordMin: t('auth.validationPasswordMin'),
    }),
    [t],
  );

  const handleResend = async () => {
    const errors = validateAuthFields({ email, password }, validationMessages);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      await resendVerificationEmail(email.trim(), password);
      toast.success(t('auth.verificationEmailResent'));
    } catch (err) {
      if (resolveUserErrorKey(err) === 'emailAlreadyVerified') {
        toast.info(t('auth.emailAlreadyVerified'));
      } else {
        toast.apiError(err, t('auth.verificationEmailResendError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContinuePhone = () => {
    if (!phoneDigits) {
      setPhoneError(t('onboarding.fieldRequired'));
      return;
    }
    if (!phoneIsValid) {
      setPhoneError(t('onboarding.phoneInvalid'));
      return;
    }
    setPhoneError(null);
    const normalized = formatQatarPhoneForSubmit(phoneDigits);
    router.push(
      `/(auth)/verify-phone?phone=${encodeURIComponent(normalized)}&next=${encodeURIComponent('/(onboarding)/complete-profile')}&context=${phoneContext}&sync=1` as Href,
    );
  };

  const title =
    needsPhoneVerification && !needsEmailVerification
      ? t('auth.verifyAccountTitle')
      : t('auth.checkEmailTitle');
  const subtitle =
    needsPhoneVerification && !needsEmailVerification
      ? t('auth.verifyAccountPhoneSubtitle')
      : t('auth.checkEmailSubtitle');

  return (
    <AuthScreenLayout title={title} subtitle={subtitle}>
      <View className="gap-5">
        {emailParam ? (
          <Text
            className="text-center text-sm font-medium text-ink dark:text-white"
            style={{ fontFamily: getFontFamily('medium') }}
          >
            {emailParam}
          </Text>
        ) : null}

        {user?.isVerified ? (
          <View className="flex-row items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
            <Text
              className="flex-1 text-sm text-emerald-800 dark:text-emerald-200"
              style={{ fontFamily: getFontFamily('medium') }}
            >
              {t('auth.emailVerifiedStatus')}
            </Text>
          </View>
        ) : null}

        {needsEmailVerification ? (
          <>
            <View className="gap-4 rounded-2xl border border-brand-100 bg-brand-50/40 p-4 dark:border-brand-900/60 dark:bg-brand-950/30">
              <Text
                className="text-sm font-semibold text-ink dark:text-white"
                style={{ fontFamily: getFontFamily('semibold') }}
              >
                {t('auth.checkEmailReceivedTitle')}
              </Text>
              <Text
                className="text-sm leading-5 text-ink-muted dark:text-white/85"
                style={{ fontFamily: getFontFamily('regular') }}
              >
                {t('auth.checkEmailInstructions')}
              </Text>
              <Text
                className="text-sm leading-5 text-ink-muted dark:text-white/85"
                style={{ fontFamily: getFontFamily('regular') }}
              >
                {t('auth.checkEmailSpamHint')}
              </Text>
              <Button
                title={t('auth.checkEmailLoginButton')}
                variant="gold"
                size="lg"
                className="w-full rounded-2xl"
                onPress={() => router.push('/(auth)/login')}
              />
            </View>

            <View className="gap-4 rounded-2xl border border-slate-200 p-4 dark:border-dm-border">
              <Text
                className="text-sm font-semibold text-ink dark:text-white"
                style={{ fontFamily: getFontFamily('semibold') }}
              >
                {t('auth.checkEmailNotReceivedTitle')}
              </Text>
              <Text
                className="text-sm leading-5 text-ink-muted dark:text-white/85"
                style={{ fontFamily: getFontFamily('regular') }}
              >
                {t('auth.checkEmailNotReceivedSubtitle')}
              </Text>

              <View>
                <Label required>{t('auth.email')}</Label>
                <Input
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder={t('auth.emailPlaceholder')}
                />
                {fieldErrors.email ? (
                  <Text className="mt-1 text-sm text-red-500">{fieldErrors.email}</Text>
                ) : null}
              </View>

              <View>
                <Label required>{t('auth.password')}</Label>
                <PasswordInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('auth.passwordPlaceholder')}
                  toggleLabels={{
                    show: t('auth.showPassword'),
                    hide: t('auth.hidePassword'),
                  }}
                />
                {fieldErrors.password ? (
                  <Text className="mt-1 text-sm text-red-500">{fieldErrors.password}</Text>
                ) : null}
              </View>

              <Button
                title={loading ? t('auth.sendingVerification') : t('auth.resendVerification')}
                variant="outline"
                size="lg"
                className="w-full rounded-2xl"
                onPress={handleResend}
                loading={loading}
              />
            </View>
          </>
        ) : null}

        {needsPhoneVerification ? (
          <View className="gap-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
            <Text
              className="text-sm font-semibold text-ink dark:text-white"
              style={{ fontFamily: getFontFamily('semibold') }}
            >
              {t('auth.checkPhoneRequiredTitle')}
            </Text>
            <Text
              className="text-sm leading-5 text-ink-muted dark:text-white/85"
              style={{ fontFamily: getFontFamily('regular') }}
            >
              {t('auth.checkPhoneRequiredSubtitle')}
            </Text>
            <View>
              <Label required>{t('onboarding.phone')}</Label>
              <QatarPhoneInput
                value={phone}
                onChange={(value) => {
                  setPhone(value);
                  if (phoneError) setPhoneError(null);
                }}
              />
              {phoneError ? <Text className="mt-1 text-sm text-red-500">{phoneError}</Text> : null}
              {!phoneError && phoneDigits.length > 0 && !phoneIsValid ? (
                <Text className="mt-1 text-sm text-red-500">{t('onboarding.phoneInvalid')}</Text>
              ) : null}
            </View>
            <Button
              title={t('auth.continueToVerifyPhone')}
              variant="gold"
              size="lg"
              className="w-full rounded-2xl"
              disabled={!phoneIsValid}
              onPress={handleContinuePhone}
            />
          </View>
        ) : null}

        {user?.isVerified && phoneVerified ? (
          <Button
            title={t('auth.continueToCompleteProfile')}
            variant="gold"
            size="lg"
            className="w-full rounded-2xl"
            onPress={() => router.replace('/(onboarding)/complete-profile')}
          />
        ) : null}
      </View>
    </AuthScreenLayout>
  );
}
