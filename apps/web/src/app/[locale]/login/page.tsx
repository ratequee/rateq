'use client';

import { AuthLayout } from '@/components/auth/auth-layout';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { useAuth } from '@/components/providers/auth-provider';
import { useProfile } from '@/components/providers/profile-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useRouter } from '@/i18n/routing';
import { isEmailNotVerifiedError } from '@/lib/auth-flow-errors';
import { authApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import { getPostAuthRedirect } from '@/lib/profile-routing';
import { isAccountDeactivatedApiError } from '@/lib/account-status';
import type { AuthenticatedUser } from '@rateq/types';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/errors';
import {
  validateLoginFields,
  sanitizeEmail,
  type LoginFieldErrors,
} from '@/lib/validation/auth-fields';
import { loadRememberedEmail, saveRememberedEmail } from '@/lib/remember-login';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Logo } from '@/components/brand/logo';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tp = useTranslations('authPage');
  const tn = useTranslations('nav');
  const { login } = useAuth();
  const { refreshOnboarding } = useProfile();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [blockEmailAutofill, setBlockEmailAutofill] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});

  const resetLoginForm = (options?: { keepRememberedEmail?: boolean }) => {
    const remembered = options?.keepRememberedEmail ? loadRememberedEmail() : '';
    setEmail(remembered);
    setPassword('');
    setRemember(Boolean(remembered));
    setBlockEmailAutofill(!remembered);
    setFieldErrors({});
    setShowPassword(false);
  };

  useEffect(() => {
    resetLoginForm({ keepRememberedEmail: true });
  }, []);

  const redirectAfterAuth = async (sessionUser: AuthenticatedUser) => {
    const [status, token] = await Promise.all([
      refreshOnboarding(),
      Promise.resolve(getAccessToken()),
    ]);
    let isFirebaseAdmin = false;
    if (token) {
      try {
        const access = await authApi.firebaseAdminAccess(token);
        isFirebaseAdmin = access.allowed;
      } catch {
        isFirebaseAdmin = false;
      }
    }
    router.push(getPostAuthRedirect(sessionUser, status, isFirebaseAdmin));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateLoginFields(
      { email, password },
      {
        email: {
          required: tp('validationEmailRequired'),
          invalid: tp('validationEmailInvalid'),
        },
        password: {
          required: tp('validationPasswordRequired'),
          min: tp('validationPasswordMin'),
        },
      },
    );

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const sessionUser = await login(email, password);
      saveRememberedEmail(email, remember);
      resetLoginForm({ keepRememberedEmail: remember });
      toast.success(tp('loginSuccess'));
      await redirectAfterAuth(sessionUser);
    } catch (err) {
      if (isAccountDeactivatedApiError(err)) {
        toast.error(tp('accountDeactivated'));
        return;
      }

      if (isEmailNotVerifiedError(err)) {
        toast.error(tp('loginEmailNotVerified'));
        router.push(`/check-email?email=${encodeURIComponent(err.email)}`);
        return;
      }

      toast.error(getFirebaseAuthErrorMessage(err, tp('loginError')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout variant="login">
      <div>
        <div className="flex flex-col items-center justify-between">
          <div className="mb-4">
            <Link href="/">
              <Logo variant="default" />
            </Link>
          </div>
          <h2 className="text-2xl font-bold text-ink sm:text-2xl">{t('loginTitle')}</h2>
          <p className="mt-2 text-sm text-ink-muted sm:text-center">{tp('loginSubtitle')}</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5" autoComplete="off">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
              {t('email')}
            </label>
            <Input
              id="email"
              name="rateq-login-email"
              type="email"
              autoComplete={remember ? 'email' : 'off'}
              value={email}
              readOnly={blockEmailAutofill}
              onFocus={() => setBlockEmailAutofill(false)}
              onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
              placeholder={tp('emailPlaceholder')}
              required
              className="h-11"
              aria-invalid={Boolean(fieldErrors.email)}
            />
            {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label htmlFor="password" className="text-sm font-medium text-ink">
                {t('password')}
              </label>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="rateq-login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tp('passwordPlaceholder')}
                required
                className="h-11 pe-10"
                aria-invalid={Boolean(fieldErrors.password)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-ink-muted transition-colors hover:text-ink"
                aria-label={showPassword ? tp('hidePassword') : tp('showPassword')}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setRemember(checked);
                  if (!checked) {
                    saveRememberedEmail('', false);
                    setEmail('');
                    setBlockEmailAutofill(true);
                  }
                }}
                className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm text-ink-muted">{tp('rememberMe')}</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-brand-500 hover:text-brand-600 hover:underline"
            >
              {tp('forgotPassword')}
            </Link>
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full bg-gold-400 text-white hover:bg-gold-500"
            style={{ marginTop: 50 }}
            disabled={loading}
          >
            {loading ? tp('signingIn') : t('loginButton')}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-muted">
          {t('noAccount')}{' '}
          <Link
            href="/register"
            className="font-semibold text-brand-500 hover:text-brand-600 hover:underline"
          >
            {tn('getStarted')}
          </Link>
        </p>
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-ink-muted">{tp('orContinue')}</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-6">
          <GoogleSignInButton
            onSuccess={async (sessionUser) => {
              await redirectAfterAuth(sessionUser);
            }}
          />
        </div>
      </div>
    </AuthLayout>
  );
}
