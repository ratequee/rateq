'use client';

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

interface MissingCategoriesBannerProps {
  /** When true, include a link to the company profile settings page. */
  linkToProfile?: boolean;
}

export function MissingCategoriesBanner({ linkToProfile = false }: MissingCategoriesBannerProps) {
  const t = useTranslations('profilePage');

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
      <p className="font-medium">{t('missingCategoriesTitle')}</p>
      <p className="mt-1">{t('missingCategoriesMessage')}</p>
      {linkToProfile ? (
        <p className="mt-3">
          <Link
            href="/dashboard/company/profile"
            className="font-semibold underline underline-offset-2 hover:text-amber-950 dark:hover:text-amber-100"
          >
            {t('missingCategoriesCta')}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
