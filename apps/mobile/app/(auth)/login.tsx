import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/input';
import { AuthDivider } from '@/components/auth/auth-divider';
import { AuthFieldGroup } from '@/components/auth/auth-field-group';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { useAuth } from '@/context/auth-context';
import { isEmailNotVerifiedError } from '@/lib/auth-flow-errors';
import { ApiError } from '@/lib/api';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/errors';
import { validateAuthFields, type AuthFieldErrors } from '@/lib/validation/auth-fields';
import { useRedirectAfterAuth } from '@/hooks/use-redirect-after-auth';
import { useAppToast } from '@/hooks/use-app-toast';
import { getFontFamily } from '@/i18n';
import { Link, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const redirectAfterAuth = useRedirectAfterAuth();
  const router = useRouter();
  const toast = useAppToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});

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
    const errors = validateAuthFields({ email, password }, validationMessages);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      const sessionUser = await login(email.trim(), password);
      await redirectAfterAuth(sessionUser);
    } catch (err) {
      if (isEmailNotVerifiedError(err)) {
        router.replace(`/(auth)/check-email?email=${encodeURIComponent(err.email)}`);
        return;
      }
      toast.error(
        err instanceof ApiError
          ? err.message
          : getFirebaseAuthErrorMessage(err, t('auth.loginError')),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      footer={
        <Text
          className="text-center text-sm text-ink-muted dark:text-white/75"
          style={{ fontFamily: getFontFamily('regular') }}
        >
          {t('auth.noAccount')}{' '}
          <Link href="/(auth)/register" asChild>
            <Text
              className="font-semibold text-brand-500 dark:text-gold-300"
              style={{ fontFamily: getFontFamily('semibold') }}
            >
              {t('auth.register')}
            </Text>
          </Link>
        </Text>
      }
    >
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

        <AuthFieldGroup label={t('auth.password')} required error={fieldErrors.password}>
          <PasswordInput
            value={password}
            onChangeText={setPassword}
            autoComplete="password"
            placeholder={t('auth.passwordPlaceholder')}
            className="h-12 rounded-2xl border-slate-200 bg-slate-50 dark:border-dm-border dark:bg-dm-elevated"
            toggleLabels={{
              show: t('auth.showPassword'),
              hide: t('auth.hidePassword'),
            }}
          />
        </AuthFieldGroup>

        <Button
          title={loading ? t('auth.signingIn') : t('auth.login')}
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
