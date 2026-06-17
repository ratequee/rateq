'use client';

import { AvatarImage } from '@/components/ui/avatar-image';
import { StarRating } from '@/components/ui/star-rating';
import { Link } from '@/i18n/routing';
import type { ReviewerRecentlyRatedCompany } from '@rateq/types';
import { useLocale, useTranslations } from 'next-intl';

interface ReviewerRecentlyRatedCompaniesListProps {
  companies: ReviewerRecentlyRatedCompany[];
}

export function ReviewerRecentlyRatedCompaniesList({
  companies,
}: ReviewerRecentlyRatedCompaniesListProps) {
  const t = useTranslations('dashboardShell');
  const tr = useTranslations('reviewerOverview');
  const locale = useLocale();

  if (!companies.length) {
    return <p className="text-sm text-ink-muted">{tr('noData')}</p>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-ink">{t('recentlyRatedCompanies')}</h3>
      <div className="space-y-3">
        {companies.map((company) => {
          const reviewedAt = new Date(company.reviewedAt);

          return (
            <Link
              key={`${company.id}-${company.reviewedAt}`}
              href={`/companies/${company.slug}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:border-brand-100 hover:bg-brand-50/40"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <AvatarImage
                  src={company.logo}
                  name={company.name}
                  variant="rounded"
                  className="h-14 w-14 shrink-0 shadow-md ring-1 ring-slate-100"
                />
                <div className="min-w-0 text-start">
                  <p className="truncate font-semibold text-ink">{company.name}</p>
                  <p className="text-sm text-ink-muted">
                    {reviewedAt.toLocaleDateString(locale, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                <StarRating value={company.rating} size="sm" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
