'use client';

import { AuthLayout } from '@/components/auth/auth-layout';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Link, useRouter } from '@/i18n/routing';
import { UserRole } from '@rateq/types';
import { Building2, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const tp = useTranslations('authPage');
  const tn = useTranslations('nav');
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<string>(UserRole.USER);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error(tp('passwordMismatch'));
      return;
    }

    if (!acceptedTerms) {
      toast.error(tp('termsRequired'));
      return;
    }

    setLoading(true);
    try {
      await register({ email, password, role });
      toast.success(tp('registerSuccess'));
      router.push(role === UserRole.COMPANY ? '/dashboard/company' : '/');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tp('registerError'));
    } finally {
      setLoading(false);
    }
  };

  const accountTypes = [
    {
      value: UserRole.USER,
      icon: User,
      title: t('user'),
      description: tp('userDescription'),
    },
    {
      value: UserRole.COMPANY,
      icon: Building2,
      title: t('company'),
      description: tp('companyDescription'),
    },
  ];

  return (
    <AuthLayout variant="register">
      <div>
        <h2 className="text-2xl font-bold text-ink sm:text-3xl">{t('registerTitle')}</h2>
        <p className="mt-2 text-sm text-ink-muted sm:text-base">{tp('registerSubtitle')}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <fieldset>
            <legend className="mb-3 text-sm font-medium text-ink">{t('accountType')}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {accountTypes.map(({ value, icon: Icon, title, description }) => {
                const selected = role === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={cn(
                      'rounded-xl border p-4 text-start transition-all',
                      selected
                        ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-white hover:border-brand-200',
                    )}
                    aria-pressed={selected}
                  >
                    <Icon
                      className={cn('h-5 w-5', selected ? 'text-brand-500' : 'text-ink-muted')}
                      aria-hidden
                    />
                    <p className="mt-2 font-semibold text-ink">{title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">{description}</p>
                  </button>
                );
              })}
            </div>
          </fieldset>

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
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
              {t('password')}
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tp('passwordPlaceholder')}
              required
              minLength={8}
              className="h-11"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-ink">
              {t('confirmPassword')}
            </label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={tp('confirmPasswordPlaceholder')}
              required
              minLength={8}
              className="h-11"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
              required
            />
            <span className="text-sm leading-relaxed text-ink-muted">
              {tp('termsPrefix')}{' '}
              <Link href="/contact" className="font-medium text-brand-500 hover:underline">
                {tp('termsLink')}
              </Link>{' '}
              {tp('termsAnd')}{' '}
              <Link href="/contact" className="font-medium text-brand-500 hover:underline">
                {tp('privacyLink')}
              </Link>
            </span>
          </label>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? tp('creatingAccount') : t('registerButton')}
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
          {t('hasAccount')}{' '}
          <Link href="/login" className="font-semibold text-brand-500 hover:text-brand-600 hover:underline">
            {tn('login')}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
