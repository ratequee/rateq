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
import { Logo } from '@/components/brand/logo';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tp = useTranslations('authPage');
  const tn = useTranslations('nav');
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        <div className="flex flex-col items-center justify-between">
        <div className="mb-4">
          <Link href="/">
            <Logo variant="default"/>
          </Link>
        </div>
        <h2 className="text-2xl font-bold text-ink sm:text-2xl">{t('loginTitle')}</h2>
        <p className="mt-2 text-sm text-ink-muted sm:text-center">{tp('loginSubtitle')}</p>
        </div>
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
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tp('passwordPlaceholder')}
                required
                className="h-11 pe-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-ink-muted transition-colors hover:text-ink"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm text-ink-muted">{tp('rememberMe')}</span>
            </label>
            <Link
              href="/contact"
              className="text-sm font-medium text-brand-500 hover:text-brand-600 hover:underline"
            >
              {tp('forgotPassword')}
            </Link>
          </div>
          <Button type="submit" size="lg" className="w-full bg-gold-400 text-white hover:bg-gold-500" style={{marginTop: 50}} disabled={loading}>
            {loading ? tp('signingIn') : t('loginButton')}
          </Button>
        </form>

        <p className="text-center text-sm text-ink-muted mt-4">
          {t('noAccount')}{' '}
          <Link href="/register" className="font-semibold text-brand-500 hover:text-brand-600 hover:underline">
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
          <Image src="/images/fb.svg" alt="Google" width={10} height={10} />
          <Image src="/images/x.svg" alt="Apple" width={16} height={16} />
          <Image src="/images/google.svg" alt="Apple" width={22} height={22} />
        </div>
      </div>
    </AuthLayout>
  );
}
