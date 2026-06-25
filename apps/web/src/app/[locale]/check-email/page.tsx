'use client';

import { AuthLayout } from '@/components/auth/auth-layout';
import { Logo } from '@/components/brand/logo';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRedirectVerifiedFromCheckEmail } from '@/hooks/use-require-verified-auth';
import { Link } from '@/i18n/routing';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/errors';
import { validateEmailAddress, validatePassword } from '@/lib/validation/auth-fields';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';

function CheckEmailContent() {
  const tp = useTranslations('authPage');
  const { resendVerificationEmail } = useAuth();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email') ?? '';

  useRedirectVerifiedFromCheckEmail();

  const [email, setEmail] = useState(emailFromQuery);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { email?: string; password?: string } = {};
    const emailError = validateEmailAddress(email, {
      required: tp('validationEmailRequired'),
      invalid: tp('validationEmailInvalid'),
    });
    const passwordError = validatePassword(password, {
      required: tp('validationPasswordRequired'),
      min: tp('validationPasswordMin'),
      max: tp('validationPasswordMax'),
      weak: tp('validationPasswordWeak'),
    });

    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await resendVerificationEmail(email, password);
      toast.success(tp('verificationEmailResent'));
    } catch (err) {
      if (err instanceof Error && err.message.includes('already verified')) {
        toast.success(tp('emailAlreadyVerified'));
      } else {
        toast.error(getFirebaseAuthErrorMessage(err, tp('verificationEmailResendError')));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout variant="login">
      <div>
        <div className="flex flex-col items-center">
          <div className="mb-4">
            <Link href="/">
              <Logo variant="default" />
            </Link>
          </div>
          <h2 className="text-2xl font-bold text-ink dark:text-white sm:text-2xl">
            {tp('checkEmailTitle')}
          </h2>
          <p className="mt-2 text-center text-sm text-ink-muted dark:text-slate-300">
            {tp('checkEmailSubtitle')}
          </p>
          {emailFromQuery && (
            <p className="mt-3 text-center text-sm font-medium text-ink dark:text-white">
              {emailFromQuery}
            </p>
          )}
        </div>

        <div className="mt-8 space-y-4 rounded-xl border border-brand-100 bg-brand-50/40 p-4 text-sm leading-relaxed text-ink-muted dark:border-brand-900/60 dark:bg-brand-950/30 dark:text-slate-200">
          <p>{tp('checkEmailInstructions')}</p>
        </div>

        <form onSubmit={handleResend} className="mt-6 space-y-4">
          <p className="text-sm font-medium text-ink dark:text-white">
            {tp('resendVerificationTitle')}
          </p>
          <div>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tp('emailPlaceholder')}
              autoComplete="email"
              className="h-11"
            />
            {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
          </div>
          <div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tp('passwordPlaceholder')}
              autoComplete="current-password"
              className="h-11"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? tp('sendingVerificationEmail') : tp('resendVerificationButton')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted dark:text-slate-300">
          {tp('alreadyVerified')}{' '}
          <Link
            href="/login"
            className="font-semibold text-brand-500 hover:text-brand-600 hover:underline dark:text-brand-300 dark:hover:text-white"
          >
            {tp('backToLogin')}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-ink-muted dark:text-slate-300">Loading...</div>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
