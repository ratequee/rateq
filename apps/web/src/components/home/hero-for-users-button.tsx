'use client';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/components/providers/auth-provider';
import { useProfile } from '@/components/providers/profile-provider';
import { getDashboardHref } from '@/lib/profile-routing';
import { useTranslations } from 'next-intl';

export function HeroForUsersButton() {
  const t = useTranslations('home');
  const { user, adminAccess } = useAuth();
  const { onboarding } = useProfile();

  if (!user) {
    return (
      <Link href="/login">
        <Button
          variant="outline-brand"
          size="lg"
          className="min-w-[140px] border-0 shadow-lg text-brand-500 dark:border dark:border-white/35 dark:bg-white/10 dark:text-white dark:shadow-none dark:hover:bg-white/20 sm:min-w-[50%]"
        >
          {t('forUsers')}
        </Button>
      </Link>
    );
  }

  return (
    <Link href={getDashboardHref(user, onboarding, adminAccess)}>
      <Button
        variant="outline-brand"
        size="lg"
        className="min-w-[140px] border-0 shadow-lg text-brand-500 dark:border dark:border-white/35 dark:bg-white/10 dark:text-white dark:shadow-none dark:hover:bg-white/20 sm:min-w-[50%]"
      >
        {t('forUsers')}
      </Button>
    </Link>
  );
}
