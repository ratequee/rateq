import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthFieldGroup } from '@/components/auth/auth-field-group';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { useAuth } from '@/context/auth-context';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/errors';
import { validateEmailField } from '@/lib/validation/auth-fields';
import { useAppToast } from '@/hooks/use-app-toast';
import { getFontFamily } from '@/i18n';
import { Link, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const toast = useAppToast();
  const [email, setEmail] = useState(emailParam ?? '');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string }>({});

  const validationMessages = useMemo(
    () => ({
      emailRequired: t('auth.validationEmailRequired'),
      emailInvalid: t('auth.validationEmailInvalid'),
    }),
    [t],
  );

  const handleSubmit = async () => {
    const errors = validateEmailField(email, validationMessages);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await resetPassword(normalizedEmail);
      setEmail(normalizedEmail);
      setSubmitted(true);
      toast.success(t('auth.forgotPasswordSuccess'));
    } catch (err) {
      toast.error(getFirebaseAuthErrorMessage(err, t('auth.forgotPasswordError')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      title={t('auth.forgotPasswordTitle')}
      subtitle={t('auth.forgotPasswordSubtitle')}
      footer={
        <Text
          className="text-center text-sm text-ink-muted dark:text-white/75"
          style={{ fontFamily: getFontFamily('regular') }}
        >
          {submitted ? null : <>{t('auth.rememberPassword')} </>}
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
      {submitted ? (
        <View className="gap-5">
          <View className="rounded-xl border border-brand-100 bg-brand-50/40 p-4 dark:border-brand-900/60 dark:bg-brand-950/30">
            <Text
              className="text-sm leading-5 text-ink-muted dark:text-white/85"
              style={{ fontFamily: getFontFamily('regular') }}
            >
              {t('auth.forgotPasswordSuccessDetail', { email })}
            </Text>
          </View>

          <Link href="/(auth)/login" asChild>
            <Button
              title={t('auth.backToLogin')}
              variant="gold"
              size="lg"
              className="w-full rounded-2xl"
            />
          </Link>
        </View>
      ) : (
        <View className="gap-5">
          <AuthFieldGroup label={t('auth.email')} required error={fieldErrors.email}>
            <Input
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder={t('auth.emailPlaceholder')}
              className="h-12 rounded-2xl border-slate-200 bg-slate-50 dark:border-dm-border dark:bg-dm-elevated"
            />
          </AuthFieldGroup>

          <Button
            title={loading ? t('auth.sendingResetLink') : t('auth.forgotPasswordButton')}
            variant="gold"
            size="lg"
            className="mt-1 w-full rounded-2xl"
            onPress={handleSubmit}
            loading={loading}
          />
        </View>
      )}
    </AuthScreenLayout>
  );
}
