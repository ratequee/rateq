import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/input';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { useAuth } from '@/context/auth-context';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/errors';
import { validateAuthFields } from '@/lib/validation/auth-fields';
import { Link, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Text, View } from 'react-native';
import { getFontFamily } from '@/i18n';

export default function CheckEmailScreen() {
  const { t } = useTranslation();
  const { resendVerificationEmail } = useAuth();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(emailParam ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

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
      Alert.alert(t('auth.verificationEmailResent'));
    } catch (err) {
      if (err instanceof Error && err.message.includes('already verified')) {
        Alert.alert(t('auth.emailAlreadyVerified'));
      } else {
        Alert.alert(
          t('common.error'),
          getFirebaseAuthErrorMessage(err, t('auth.verificationEmailResendError')),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      title={t('auth.checkEmailTitle')}
      subtitle={t('auth.checkEmailSubtitle')}
      footer={
        <Text
          className="text-center text-sm text-ink-muted dark:text-white/85"
          style={{ fontFamily: getFontFamily('regular') }}
        >
          <Link href="/(auth)/login" asChild>
            <Text
              className="font-semibold text-brand-500 dark:text-gold-300"
              style={{ fontFamily: getFontFamily('semibold') }}
            >
              {t('auth.backToLogin')}
            </Text>
          </Link>
        </Text>
      }
    >
      <View className="gap-5">
        {emailParam ? (
          <Text
            className="text-center text-sm font-medium text-ink dark:text-white"
            style={{ fontFamily: getFontFamily('medium') }}
          >
            {emailParam}
          </Text>
        ) : null}

        <View className="rounded-xl border border-brand-100 bg-brand-50/40 p-4 dark:border-brand-900/60 dark:bg-brand-950/30">
          <Text
            className="text-sm leading-5 text-ink-muted dark:text-white/85"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {t('auth.checkEmailInstructions')}
          </Text>
          <Text
            className="mt-2 text-sm leading-5 text-ink-muted dark:text-white/85"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {t('auth.checkEmailSpamHint')}
          </Text>
        </View>

        <Text
          className="text-sm font-medium text-ink dark:text-white"
          style={{ fontFamily: getFontFamily('medium') }}
        >
          {t('auth.resendVerificationTitle')}
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
          variant="gold"
          size="lg"
          className="w-full rounded-2xl"
          onPress={handleResend}
          loading={loading}
        />
      </View>
    </AuthScreenLayout>
  );
}
