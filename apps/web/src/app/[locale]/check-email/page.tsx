'use client';

import { AuthLayout } from '@/components/auth/auth-layout';
import { Logo } from '@/components/brand/logo';
import { useAuth } from '@/components/providers/auth-provider';
import { useProfile } from '@/components/providers/profile-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QatarPhoneInput } from '@/components/ui/qatar-phone-input';
import { useRedirectVerifiedFromCheckEmail } from '@/hooks/use-require-verified-auth';
import { Link, useRouter } from '@/i18n/routing';
import { getLinkedFirebasePhoneNumber } from '@/lib/firebase/phone-auth';
import {
  extractQatarPhoneDigits,
  formatQatarPhoneForSubmit,
  isValidQatarPhoneDigits,
} from '@/lib/qatar-phone';
import { validateEmailAddress, validatePassword } from '@/lib/validation/auth-fields';
import { useUserFacingError } from '@/hooks/use-user-facing-error';
import { resolveUserErrorKey } from '@rateq/utils';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

function CheckEmailContent() {
  const tp = useTranslations('authPage');
  const tProfile = useTranslations('profilePage');
  const resolveError = useUserFacingError();
  const { user, resendVerificationEmail } = useAuth();
  const { onboarding } = useProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email') ?? user?.email ?? '';
  const contextParam = searchParams.get('context');
  const phoneContext =
    contextParam === 'company' || contextParam === 'reviewer' ? contextParam : 'reviewer';
  const forceNeedPhone = searchParams.get('needPhone') === '1';

  useRedirectVerifiedFromCheckEmail();

  const [email, setEmail] = useState(emailFromQuery);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [linkedPhone, setLinkedPhone] = useState<string | null>(null);

  useEffect(() => {
    setLinkedPhone(getLinkedFirebasePhoneNumber());
  }, [user, onboarding]);

  const hasProfilePhone = Boolean(onboarding?.reviewerProfile?.phone || onboarding?.company?.phone);
  const phoneVerified = Boolean(linkedPhone || hasProfilePhone || user?.phoneVerified);
  const needsEmailVerification = !user || !user.isVerified;
  const needsPhoneVerification = useMemo(() => {
    if (forceNeedPhone && !phoneVerified) return true;
    if (!user?.isVerified) return false;
    if (onboarding?.isProfileComplete) return false;
    return !phoneVerified;
  }, [forceNeedPhone, phoneVerified, user?.isVerified, onboarding?.isProfileComplete]);

  useEffect(() => {
    if (emailFromQuery) setEmail(emailFromQuery);
  }, [emailFromQuery]);

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
      if (resolveUserErrorKey(err) === 'emailAlreadyVerified') {
        toast.success(tp('emailAlreadyVerified'));
      } else {
        toast.error(resolveError(err, tp('verificationEmailResendError')));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContinuePhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidQatarPhoneDigits(phone)) {
      setPhoneError(tp('validationPhoneInvalid'));
      return;
    }
    setPhoneError(null);
    const normalized = formatQatarPhoneForSubmit(phone);
    router.push(
      `/register/verify-phone?phone=${encodeURIComponent(normalized)}&next=/complete-profile&context=${phoneContext}&sync=1`,
    );
  };

  const title =
    needsPhoneVerification && !needsEmailVerification
      ? tp('verifyAccountTitle')
      : tp('checkEmailTitle');
  const subtitle =
    needsPhoneVerification && !needsEmailVerification
      ? tp('verifyAccountPhoneSubtitle')
      : tp('checkEmailSubtitle');

  return (
    <AuthLayout variant="login">
      <div>
        <div className="flex flex-col items-center">
          <div className="mb-4">
            <Link href="/">
              <Logo variant="default" />
            </Link>
          </div>
          <h2 className="text-2xl font-bold text-ink dark:text-white sm:text-2xl">{title}</h2>
          <p className="mt-2 text-center text-sm text-ink-muted dark:text-slate-300">{subtitle}</p>
          {(emailFromQuery || user?.email) && (
            <p className="mt-3 text-center text-sm font-medium text-ink dark:text-white">
              {emailFromQuery || user?.email}
            </p>
          )}
        </div>

        {user?.isVerified ? (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            {tp('emailVerifiedStatus')}
          </div>
        ) : null}

        {needsEmailVerification ? (
          <>
            <section className="mt-8 space-y-4 rounded-xl border border-brand-100 bg-brand-50/40 p-5 dark:border-brand-900/60 dark:bg-brand-950/30">
              <h3 className="text-sm font-semibold text-ink dark:text-white">
                {tp('checkEmailReceivedTitle')}
              </h3>
              <div className="space-y-2 text-sm leading-relaxed text-ink-muted dark:text-slate-200">
                <p>{tp('checkEmailInstructions')}</p>
                <p>{tp('checkEmailSpamHint')}</p>
              </div>
              <Link href="/login" className="block">
                <Button
                  type="button"
                  size="lg"
                  className="w-full bg-gold-400 text-white hover:bg-gold-500"
                >
                  {tp('checkEmailLoginButton')}
                </Button>
              </Link>
            </section>

            <section className="mt-6 space-y-4 rounded-xl border border-default p-5">
              <h3 className="text-sm font-semibold text-ink dark:text-white">
                {tp('checkEmailNotReceivedTitle')}
              </h3>
              <p className="text-sm text-ink-muted dark:text-slate-300">
                {tp('checkEmailNotReceivedSubtitle')}
              </p>
              <form onSubmit={handleResend} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={tp('emailPlaceholder')}
                    autoComplete="email"
                    className="h-11"
                  />
                  {fieldErrors.email ? (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                  ) : null}
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
                  {fieldErrors.password ? (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                  ) : null}
                </div>
                <Button type="submit" variant="outline" className="w-full" disabled={loading}>
                  {loading ? tp('sendingVerificationEmail') : tp('resendVerificationButton')}
                </Button>
              </form>
            </section>
          </>
        ) : null}

        {needsPhoneVerification ? (
          <section className="mt-6 space-y-4 rounded-xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/60 dark:bg-amber-950/30">
            <h3 className="text-sm font-semibold text-ink dark:text-white">
              {tp('checkPhoneRequiredTitle')}
            </h3>
            <p className="text-sm text-ink-muted dark:text-slate-200">
              {tp('checkPhoneRequiredSubtitle')}
            </p>
            <form onSubmit={handleContinuePhone} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink dark:text-white">
                  {tProfile('phone')}
                  <span className="text-red-600"> *</span>
                </label>
                <QatarPhoneInput
                  id="verify-phone"
                  value={phone || extractQatarPhoneDigits(linkedPhone ?? '')}
                  onChange={setPhone}
                  placeholder={tProfile('phonePlaceholder')}
                />
                {phoneError ? <p className="mt-1 text-sm text-red-600">{phoneError}</p> : null}
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full bg-gold-400 text-white hover:bg-gold-500"
              >
                {tp('continueToVerifyPhone')}
              </Button>
            </form>
          </section>
        ) : null}

        {user?.isVerified && phoneVerified ? (
          <div className="mt-6">
            <Link href="/complete-profile" className="block">
              <Button
                type="button"
                size="lg"
                className="w-full bg-gold-400 text-white hover:bg-gold-500"
              >
                {tp('continueToCompleteProfile')}
              </Button>
            </Link>
          </div>
        ) : null}
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
