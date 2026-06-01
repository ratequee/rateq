'use client';

import { AuthLayout } from '@/components/auth/auth-layout';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api';
import { Link, useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tp = useTranslations('authPage');
  const tn = useTranslations('nav');
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success(tp('loginSuccess'));
      router.push('/');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tp('loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout variant="login">
      <div>
        <h2 className="text-2xl font-bold text-ink sm:text-3xl">{t('loginTitle')}</h2>
        <p className="mt-2 text-sm text-ink-muted sm:text-base">{tp('loginSubtitle')}</p>

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

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label htmlFor="password" className="text-sm font-medium text-ink">
                {t('password')}
              </label>
              <Link
                href="/contact"
                className="text-sm font-medium text-brand-500 hover:text-brand-600 hover:underline"
              >
                {tp('forgotPassword')}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tp('passwordPlaceholder')}
              required
              className="h-11"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
            />
            <span className="text-sm text-ink-muted">{tp('rememberMe')}</span>
          </label>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? tp('signingIn') : t('loginButton')}
          </Button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-ink-muted">{tp('orContinue')}</span>
          </div>
        </div>

        <p className="text-center text-sm text-ink-muted">
          {t('noAccount')}{' '}
          <Link href="/register" className="font-semibold text-brand-500 hover:text-brand-600 hover:underline">
            {tn('getStarted')}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
