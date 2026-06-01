import { Link } from '@/i18n/routing';
import { ChevronRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { JSX } from 'react';

interface CompanyBreadcrumbProps {
  companyName: string;
  categoryHref?: string;
  categoryLabel?: string;
}

export async function CompanyBreadcrumb({
  companyName,
  categoryHref = '/categories',
  categoryLabel,
}: CompanyBreadcrumbProps): Promise<JSX.Element> {
  const t = await getTranslations('companyPage');
  const tc = await getTranslations('categories');

  return (
    <nav aria-label={t('breadcrumbAria')} className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
        <li>
          <Link href="/" className="transition-colors hover:text-gold-500">
            {t('home')}
          </Link>
        </li>
        <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
        <li>
          <Link href={categoryHref} className="transition-colors hover:text-gold-500">
            {categoryLabel ?? tc('metaTitle')}
          </Link>
        </li>
        <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
        <li className="font-medium text-gold-500" aria-current="page">
          {companyName}
        </li>
      </ol>
    </nav>
  );
}
