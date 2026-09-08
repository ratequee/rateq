'use client';

import { AuthLayout } from '@/components/auth/auth-layout';
import { AppleSignInButton } from '@/components/auth/apple-sign-in-button';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { useAuth } from '@/components/providers/auth-provider';
import { useProfile } from '@/components/providers/profile-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QatarPhoneInput } from '@/components/ui/qatar-phone-input';
import { Link, useRouter } from '@/i18n/routing';
import { isEmailVerificationPendingError, isOAuthOnlyAccountError } from '@/lib/auth-flow-errors';
import { authApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import { getPostAuthRedirect } from '@/lib/profile-routing';
import type { AuthenticatedUser } from '@rateq/types';
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
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const tp = useTranslations('authPage');
  const tn = useTranslations('nav');
  const tProfile = useTranslations('profilePage');
  const { beginRegistration, finishRegistration } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors & { phone?: string }>({});

  useEffect(() => {
    const invitedEmail = searchParams.get('email');
    if (invitedEmail) {
      setEmail(sanitizeEmail(invitedEmail));
    }

    const pending = getPendingRegistration();
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
    const [status, token] = await Promise.all([
      refreshOnboarding(),
      Promise.resolve(getAccessToken()),
    ]);
    let adminAccess = null;
    if (token) {
      try {
        adminAccess = await authApi.adminAccess(token);
      } catch {
        adminAccess = null;
      }
    }
    await router.push(getPostAuthRedirect(sessionUser, status, adminAccess));
  };

  const handleContinueToPhone = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: RegisterFieldErrors & { phone?: string } = {
      ...validateRegisterFields({ name, email, password }, validationMessages),
    };

    if (!isValidQatarPhoneDigits(phone)) {
      errors.phone = tp('validationPhoneInvalid');
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
      localStorage.setItem('rateq_pending_name', trimmedName);

      await beginRegistration({
        email: normalizedEmail,
        password,
        name: trimmedName,
      });

      savePendingRegistration({
        name: trimmedName,
        email: normalizedEmail,
        phone,
        phoneVerified: false,
      });

      router.push(
        `/register/verify-phone?phone=${encodeURIComponent(formatQatarPhoneForSubmit(phone))}`,
      );
    } catch (err) {
      if (isOAuthOnlyAccountError(err)) {
        toast.error(
          tp('oauthOnlyAccountMessage', {
            provider:
              err.providerLabel === 'Apple' ? tp('continueWithApple') : tp('continueWithGoogle'),
          }),
        );
        return;
      }

      toast.error(getFirebaseAuthErrorMessage(err, tp('registerError')));
    } finally {
      setLoading(false);
    }
  };

  const handleFinishRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneVerified) {
      toast.error(tp('phoneVerificationRequired'));
      return;
    }

    setLoading(true);
    try {
      await finishRegistration(email.trim().toLowerCase());
    } catch (err) {
      if (isEmailVerificationPendingError(err)) {
        clearPendingRegistration();
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
        <form
          onSubmit={phoneVerified ? handleFinishRegistration : handleContinueToPhone}
          className="mt-8 space-y-5"
        >
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
              disabled={phoneVerified}
              className="h-11 dark:border-dm-border dark:bg-dm-elevated"
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
              disabled={phoneVerified}
              className="h-11 dark:border-dm-border dark:bg-dm-elevated"
              aria-invalid={Boolean(fieldErrors.email)}
            />
            {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
          </div>

          {!phoneVerified ? (
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
                  className="h-11 pe-10 dark:border-dm-border dark:bg-dm-elevated"
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
          ) : null}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink dark:text-white">
              {tProfile('phone')}
              <span className="text-red-600"> *</span>
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <QatarPhoneInput
                id="phone"
                value={phone}
                onChange={(value) => {
                  setPhone(value);
                  setPhoneVerified(false);
                }}
                placeholder={tProfile('phonePlaceholder')}
                className="flex-1"
                disabled={phoneVerified}
                aria-invalid={Boolean(fieldErrors.phone)}
              />
              {phoneVerified ? (
                <div className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  {tProfile('phoneVerifiedLabel')}
                </div>
              ) : null}
            </div>
            {fieldErrors.phone ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
            ) : (
              <p className="mt-1 text-xs text-ink-muted dark:text-white/75">
                {tp('phoneRegisterHint')}
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full bg-gold-400 text-white hover:bg-gold-500"
            style={{ marginTop: 50 }}
            disabled={loading}
          >
            {loading
              ? phoneVerified
                ? tp('creatingAccount')
                : tp('continuingToPhone')
              : phoneVerified
                ? t('registerButton')
                : tp('continueToVerifyPhone')}
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
            <div className="w-full border-t border-slate-200 dark:border-dm-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-3 text-ink-muted dark:bg-dm-surface dark:text-white/75">
              {tp('orContinueWith')}
            </span>
          </div>
        </div>
        <div className="flex justify-center gap-3">
          <GoogleSignInButton onSuccess={redirectAfterAuth} />
          <AppleSignInButton onSuccess={redirectAfterAuth} />
        </div>
      </div>
    </AuthLayout>
  );
}
