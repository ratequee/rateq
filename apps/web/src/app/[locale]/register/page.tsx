'use client';

import { AuthLayout } from '@/components/auth/auth-layout';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { useAuth } from '@/components/providers/auth-provider';
import { useProfile } from '@/components/providers/profile-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useRouter } from '@/i18n/routing';
import { isEmailVerificationPendingError } from '@/lib/auth-flow-errors';
import { getPostAuthRedirect } from '@/lib/profile-routing';
import type { AuthenticatedUser } from '@rateq/types';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/errors';
import {
  sanitizeDisplayName,
  sanitizeEmail,
  sanitizePassword,
  validateRegisterFields,
  type RegisterFieldErrors,
} from '@/lib/validation/auth-fields';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Logo } from '@/components/brand/logo';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const tp = useTranslations('authPage');
  const tn = useTranslations('nav');
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});

  useEffect(() => {
    const invitedEmail = searchParams.get('email');
    if (invitedEmail) {
      setEmail(sanitizeEmail(invitedEmail));
    }
  }, [searchParams]);

  const validationMessages = {
    name: {
      required: tp('validationNameRequired'),
      invalid: tp('validationNameInvalid'),
      min: tp('validationNameMin'),
      max: tp('validationNameMax'),
    },
    email: {
      required: tp('validationEmailRequired'),
      invalid: tp('validationEmailInvalid'),
    },
    password: {
      required: tp('validationPasswordRequired'),
      min: tp('validationPasswordMin'),
      max: tp('validationPasswordMax'),
      weak: tp('validationPasswordWeak'),
      whitespace: tp('validationPasswordWhitespace'),
    },
  };

  const { refreshOnboarding } = useProfile();

  const redirectAfterAuth = async (sessionUser: AuthenticatedUser) => {
    const status = await refreshOnboarding();
    await router.push(getPostAuthRedirect(sessionUser, status));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateRegisterFields({ name, email, password }, validationMessages);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const trimmedName = name.trim();
      localStorage.setItem('rateq_pending_name', trimmedName);

      await register({
        email: email.trim().toLowerCase(),
        password,
        name: trimmedName,
      });
    } catch (err) {
      if (isEmailVerificationPendingError(err)) {
        toast.success(tp('registerVerificationSent'));
        router.push(`/check-email?email=${encodeURIComponent(err.email)}`);
        return;
      }

      toast.error(getFirebaseAuthErrorMessage(err, tp('registerError')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout variant="register">
      <div>
        <div className="flex flex-col items-center justify-between">
          <div className="mb-4">
            <Link href="/">
              <Logo variant="auto" />
            </Link>
          </div>
          <h2 className="text-2xl font-bold text-ink dark:text-white sm:text-2xl">
            {t('registerTitle')}
          </h2>
          <p className="mt-2 text-sm text-ink-muted dark:text-white/85 sm:text-center">
            {tp('registerSubtitle')}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-ink dark:text-white"
            >
              {t('name')}
            </label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(sanitizeDisplayName(e.target.value))}
              onBlur={() => setName((prev) => prev.trim())}
              placeholder={tp('namePlaceholder')}
              required
              className="h-11 dark:border-slate-700 dark:bg-slate-800"
              aria-invalid={Boolean(fieldErrors.name)}
            />
            {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
          </div>
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-ink dark:text-white"
            >
              {t('email')}
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
              placeholder={tp('emailPlaceholder')}
              required
              className="h-11 dark:border-slate-700 dark:bg-slate-800"
              aria-invalid={Boolean(fieldErrors.email)}
            />
            {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label htmlFor="password" className="text-sm font-medium text-ink dark:text-white">
                {t('password')}
              </label>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(sanitizePassword(e.target.value))}
                placeholder={tp('passwordPlaceholder')}
                required
                className="h-11 pe-10 dark:border-slate-700 dark:bg-slate-800"
                aria-invalid={Boolean(fieldErrors.password)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-ink-muted transition-colors hover:text-ink dark:text-white/70 dark:hover:text-white"
                aria-label={showPassword ? tp('hidePassword') : tp('showPassword')}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
            )}
            <p className="mt-1 text-xs text-ink-muted dark:text-white/75">{tp('passwordHint')}</p>
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full bg-gold-400 text-white hover:bg-gold-500"
            style={{ marginTop: 50 }}
            disabled={loading}
          >
            {loading ? tp('creatingAccount') : t('registerButton')}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-muted dark:text-white/85">
          {t('hasAccount')}{' '}
          <Link
            href="/login"
            className="font-semibold text-brand-500 hover:text-brand-600 hover:underline dark:text-white dark:hover:text-white/85"
          >
            {tn('login')}
          </Link>
        </p>
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-ink-muted dark:bg-slate-900 dark:text-white/75">
              {tp('orContinue')}
            </span>
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
