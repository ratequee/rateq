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
import Image from 'next/image';
import { Logo } from '@/components/brand/logo';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const tp = useTranslations('authPage');
  const tn = useTranslations('nav');
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      if (name.trim()) {
        localStorage.setItem('rateq_pending_name', name.trim());
      }
      await register({ email, password, name });
      toast.success(tp('registerSuccess'));
      router.push('/complete-profile');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tp('registerError'));
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
            <Logo variant="default"/>
          </Link>
        </div>
        <h2 className="text-2xl font-bold text-ink sm:text-2xl">{t('registerTitle')}</h2>
        <p className="mt-2 text-sm text-ink-muted sm:text-center">{tp('registerSubtitle')}</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
              {t('name')}
            </label>
            <Input
              id="email"
              type="text"
              autoComplete='name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tp('namePlaceholder')}
              required
              className="h-11"
            />
          </div>
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
          <Button type="submit" size="lg" className="w-full bg-gold-400 text-white hover:bg-gold-500" style={{marginTop: 50}} disabled={loading}>
          {loading ? tp('creatingAccount') : t('registerButton')}
          </Button>
        </form>

        <p className="text-center text-sm text-ink-muted mt-4">
          {t('hasAccount')}{' '}
          <Link href="/login" className="font-semibold text-brand-500 hover:text-brand-600 hover:underline">
            {tn('login')}
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
