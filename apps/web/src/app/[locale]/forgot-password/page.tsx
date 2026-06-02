'use client';

import { AuthLayout } from '@/components/auth/auth-layout';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/routing';
import { ApiError, authApi } from '@/lib/api';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const tp = useTranslations('authPage');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
      toast.success(tp('forgotPasswordSuccess'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tp('forgotPasswordError'));
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
          <p className="mt-2 text-sm text-ink-muted sm:text-center">{tp('forgotPasswordSubtitle')}</p>
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

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-ink-muted">{tp('orContinue')}</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-6">
          <Image src="/images/fb.svg" alt="Facebook" width={10} height={10} />
          <Image src="/images/x.svg" alt="X" width={16} height={16} />
          <Image src="/images/google.svg" alt="Google" width={22} height={22} />
        </div>
      </div>
    </AuthLayout>
  );
}
