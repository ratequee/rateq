'use client';

import { AuthLayout } from '@/components/auth/auth-layout';
import { Logo } from '@/components/brand/logo';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/routing';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/errors';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const tp = useTranslations('authPage');
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await resetPassword(email);
      setSubmitted(true);
      toast.success(tp('forgotPasswordSuccess'));
    } catch (err) {
      toast.error(getFirebaseAuthErrorMessage(err, tp('forgotPasswordError')));
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
          <h2 className="text-2xl font-bold text-ink sm:text-2xl">{t('forgotPasswordTitle')}</h2>
          <p className="mt-2 text-sm text-ink-muted sm:text-center">
            {tp('forgotPasswordSubtitle')}
          </p>
        </div>

        {submitted ? (
          <div className="mt-8 space-y-6">
            <p className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 text-sm leading-relaxed text-ink-muted">
              {tp('forgotPasswordSuccessDetail', { email })}
            </p>
            <Link href="/login">
              <Button size="lg" className="w-full bg-gold-400 text-white hover:bg-gold-500">
                {tp('backToLogin')}
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
                {t('email')}
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tp('emailPlaceholder')}
                required
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-gold-400 text-white hover:bg-gold-500"
              style={{ marginTop: 50 }}
              disabled={loading}
            >
              {loading ? tp('sendingResetLink') : tp('forgotPasswordButton')}
            </Button>
          </form>
        )}

        {!submitted && (
          <p className="mt-4 text-center text-sm text-ink-muted">
            {tp('rememberPassword')}{' '}
            <Link
              href="/login"
              className="font-semibold text-brand-500 hover:text-brand-600 hover:underline"
            >
              {tp('backToLogin')}
            </Link>
          </p>
        )}
      </div>
    </AuthLayout>
  );
}
