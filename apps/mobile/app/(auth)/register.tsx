import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/input';
import { QatarPhoneInput } from '@/components/ui/qatar-phone-input';
import { AuthDivider } from '@/components/auth/auth-divider';
import { SocialSignInRow } from '@/components/auth/social-sign-in-row';
import { AuthFieldGroup } from '@/components/auth/auth-field-group';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { useAuth } from '@/context/auth-context';
import { isEmailVerificationPendingError, isOAuthOnlyAccountError } from '@/lib/auth-flow-errors';
import { ApiError } from '@/lib/api';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/errors';
import { getLinkedFirebasePhoneNumber, isSamePhoneNumber } from '@/lib/firebase/phone-auth';
import {
  clearPendingRegistration,
  getPendingRegistration,
  savePendingRegistration,
} from '@/lib/pending-registration';
import {
  extractQatarPhoneDigits,
  formatQatarPhoneForSubmit,
  isValidQatarPhoneDigits,
} from '@/lib/qatar-phone';
import { validateAuthFields, type AuthFieldErrors } from '@/lib/validation/auth-fields';
import { useAppToast } from '@/hooks/use-app-toast';
import { getFontFamily } from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { beginRegistration, finishRegistration } = useAuth();
  const router = useRouter();
  const toast = useAppToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    AuthFieldErrors & { name?: string; phone?: string }
  >({});

  useEffect(() => {
    void (async () => {
      const pending = await getPendingRegistration();
      if (pending) {
        if (pending.name) setName(pending.name);
        if (pending.email) setEmail(pending.email);
        if (pending.phone) setPhone(pending.phone);
        if (pending.phoneVerified) setPhoneVerified(true);
      }

      const linked = getLinkedFirebasePhoneNumber();
      if (linked) {
        const digits = extractQatarPhoneDigits(linked);
        setPhone(digits);
        if (
          pending?.phoneVerified ||
          (pending?.phone && isSamePhoneNumber(linked, formatQatarPhoneForSubmit(pending.phone)))
        ) {
          setPhoneVerified(true);
        }
      }
    })();
  }, []);

  const validationMessages = useMemo(
    () => ({
      emailRequired: t('auth.validationEmailRequired'),
      emailInvalid: t('auth.validationEmailInvalid'),
      passwordRequired: t('auth.validationPasswordRequired'),
      passwordMin: t('auth.validationPasswordMin'),
    }),
    [t],
  );

  const handleContinueToPhone = async () => {
    const errors: AuthFieldErrors & { name?: string; phone?: string } = {
      ...validateAuthFields({ email, password }, validationMessages),
    };
    if (!name.trim()) {
      errors.name = t('auth.validationNameRequired');
    }
    if (!isValidQatarPhoneDigits(phone)) {
      errors.phone = t('auth.validationPhoneInvalid');
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      const trimmedName = name.trim();
      const normalizedEmail = email.trim().toLowerCase();

      await beginRegistration({
        email: normalizedEmail,
        password,
        name: trimmedName,
      });

      await savePendingRegistration({
        name: trimmedName,
        email: normalizedEmail,
        phone,
        phoneVerified: false,
      });

      router.push(
        `/(auth)/verify-phone?phone=${encodeURIComponent(formatQatarPhoneForSubmit(phone))}` as Href,
      );
    } catch (err) {
      if (isOAuthOnlyAccountError(err)) {
        toast.error(
          t('auth.oauthOnlyAccountMessage', {
            provider:
              err.providerLabel === 'Apple'
                ? t('auth.continueWithApple')
                : t('auth.continueWithGoogle'),
          }),
        );
        return;
      }

      toast.error(
        err instanceof ApiError
          ? err.message
          : getFirebaseAuthErrorMessage(err, t('auth.registerError')),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFinishRegistration = async () => {
    if (!phoneVerified) {
      toast.error(t('auth.phoneVerificationRequired'));
      return;
    }

    setLoading(true);
    try {
      await finishRegistration(email.trim().toLowerCase());
    } catch (err) {
      if (isEmailVerificationPendingError(err)) {
        await clearPendingRegistration();
        toast.success(t('auth.registerVerificationSent'));
        router.replace(`/(auth)/check-email?email=${encodeURIComponent(err.email)}`);
        return;
      }

      toast.error(
        err instanceof ApiError
          ? err.message
          : getFirebaseAuthErrorMessage(err, t('auth.registerError')),
      );
    } finally {
      setLoading(false);
    }
  };

  const submitLabel = loading
    ? phoneVerified
      ? t('auth.creatingAccount')
      : t('auth.continuingToPhone')
    : phoneVerified
      ? t('auth.register')
      : t('auth.continueToVerifyPhone');

  return (
    <AuthScreenLayout
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
      footer={
        <Text
          className="text-center text-sm text-ink-muted dark:text-white/75"
          style={{ fontFamily: getFontFamily('regular') }}
        >
          {t('auth.hasAccount')}{' '}
          <Link href="/(auth)/login" asChild>
            <Text
              className="font-semibold text-brand-500 dark:text-gold-300"
              style={{ fontFamily: getFontFamily('semibold') }}
            >
              {t('auth.login')}
            </Text>
          </Link>
        </Text>
      }
    >
      <View className="gap-5">
        <AuthFieldGroup label={t('auth.name')} required error={fieldErrors.name}>
          <Input
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
            editable={!phoneVerified}
            placeholder={t('auth.namePlaceholder')}
            className="h-12 rounded-2xl border-slate-200 bg-slate-50 dark:border-dm-border dark:bg-dm-elevated"
          />
        </AuthFieldGroup>

        <AuthFieldGroup label={t('auth.email')} required error={fieldErrors.email}>
          <Input
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!phoneVerified}
            placeholder={t('auth.emailPlaceholder')}
            className="h-12 rounded-2xl border-slate-200 bg-slate-50 dark:border-dm-border dark:bg-dm-elevated"
          />
        </AuthFieldGroup>

        {!phoneVerified ? (
          <AuthFieldGroup label={t('auth.password')} required error={fieldErrors.password}>
            <PasswordInput
              value={password}
              onChangeText={setPassword}
              autoComplete="new-password"
              placeholder={t('auth.passwordPlaceholder')}
              className="h-12 rounded-2xl border-slate-200 bg-slate-50 dark:border-dm-border dark:bg-dm-elevated"
              toggleLabels={{
                show: t('auth.showPassword'),
                hide: t('auth.hidePassword'),
              }}
            />
          </AuthFieldGroup>
        ) : null}

        <AuthFieldGroup label={t('onboarding.phone')} required error={fieldErrors.phone}>
          <View className="flex-row items-start gap-2">
            <QatarPhoneInput
              value={phone}
              onChange={(value) => {
                setPhone(value);
                setPhoneVerified(false);
              }}
              editable={!phoneVerified}
              className="flex-1"
            />
            {phoneVerified ? (
              <View className="h-12 flex-row items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                <Ionicons name="checkmark-circle" size={18} color="#059669" />
                <Text
                  className="text-sm font-semibold text-emerald-700 dark:text-emerald-300"
                  style={{ fontFamily: getFontFamily('semibold') }}
                >
                  {t('onboarding.phoneVerifiedLabel')}
                </Text>
              </View>
            ) : null}
          </View>
          {!fieldErrors.phone && !phoneVerified ? (
            <Text
              className="mt-1.5 text-xs text-ink-muted dark:text-white/70"
              style={{ fontFamily: getFontFamily('regular') }}
            >
              {t('auth.phoneRegisterHint')}
            </Text>
          ) : null}
        </AuthFieldGroup>

        <Button
          title={submitLabel}
          variant="gold"
          size="lg"
          className="mt-1 w-full rounded-2xl"
          onPress={() =>
            void (phoneVerified ? handleFinishRegistration() : handleContinueToPhone())
          }
          loading={loading}
        />

        <AuthDivider />
        <SocialSignInRow />
      </View>
    </AuthScreenLayout>
  );
}
