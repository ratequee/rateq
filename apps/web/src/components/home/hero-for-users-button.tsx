'use client';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/components/providers/auth-provider';
import { UserRole } from '@rateq/types';
import { useTranslations } from 'next-intl';

export function HeroForUsersButton() {
  const t = useTranslations('home');
  const { user } = useAuth();

  if (!user) {
    return (
      <Link href="/login">
        <Button
          variant="outline-brand"
          size="lg"
          className="min-w-[140px] border-0 shadow-lg text-brand-500 sm:min-w-[50%]"
        >
          {t('forUsers')}
        </Button>
      </Link>
    );
  }

  const dashboardHref =
    user.role === UserRole.ADMIN
      ? '/dashboard/admin'
      : user.role === UserRole.COMPANY
        ? '/dashboard/company'
        : '/dashboard/reviewer';

  return (
    <Link href={dashboardHref}>
      <Button
        variant="outline-brand"
        size="lg"
        className="min-w-[140px] border-0 shadow-lg text-brand-500 sm:min-w-[50%]"
      >
        {t('forUsers')}
      </Button>
    </Link>
  );
}
