import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/input';
import { AuthDivider } from '@/components/auth/auth-divider';
import { AuthFieldGroup } from '@/components/auth/auth-field-group';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { useAuth } from '@/context/auth-context';
import { isEmailVerificationPendingError } from '@/lib/auth-flow-errors';
import { ApiError } from '@/lib/api';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/errors';
import { validateAuthFields, type AuthFieldErrors } from '@/lib/validation/auth-fields';
import { getFontFamily } from '@/i18n';
import { Link, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Text, View } from 'react-native';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors & { name?: string }>({});

  const validationMessages = useMemo(
    () => ({
      emailRequired: t('auth.validationEmailRequired'),
      emailInvalid: t('auth.validationEmailInvalid'),
      passwordRequired: t('auth.validationPasswordRequired'),
      passwordMin: t('auth.validationPasswordMin'),
    }),
    [t],
  );

  const handleSubmit = async () => {
    const errors: AuthFieldErrors & { name?: string } = {
      ...validateAuthFields({ email, password }, validationMessages),
    };
    if (!name.trim()) {
      errors.name = t('auth.validationNameRequired');
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      await register({ email: email.trim(), password, name: name.trim() });
    } catch (err) {
      if (isEmailVerificationPendingError(err)) {
        router.replace(`/(auth)/check-email?email=${encodeURIComponent(err.email)}`);
        return;
      }
      Alert.alert(
        t('common.error'),
        err instanceof ApiError
          ? err.message
          : getFirebaseAuthErrorMessage(err, t('auth.registerError')),
      );
    } finally {
      setLoading(false);
    }
  };

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
            placeholder={t('auth.emailPlaceholder')}
            className="h-12 rounded-2xl border-slate-200 bg-slate-50 dark:border-dm-border dark:bg-dm-elevated"
          />
        </AuthFieldGroup>

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

        <Button
          title={loading ? t('auth.creatingAccount') : t('auth.register')}
          variant="gold"
          size="lg"
          className="mt-1 w-full rounded-2xl"
          onPress={handleSubmit}
          loading={loading}
        />

        <AuthDivider />
        <GoogleSignInButton />
      </View>
    </AuthScreenLayout>
  );
}
