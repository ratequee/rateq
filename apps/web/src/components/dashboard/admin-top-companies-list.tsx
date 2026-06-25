'use client';

import { AvatarImage } from '@/components/ui/avatar-image';
import { StarRating } from '@/components/ui/star-rating';
import { useTranslations } from 'next-intl';

export interface TopRatedCompanyRow {
  id: string;
  name: string;
  logo: string | null;
  reviewCount: number;
  ratingAverage: number;
}

interface AdminTopCompaniesListProps {
  companies: TopRatedCompanyRow[];
}

export function AdminTopCompaniesList({ companies }: AdminTopCompaniesListProps) {
  const t = useTranslations('dashboardShell');
  const ta = useTranslations('adminOverview');

  if (!companies.length) {
    return <p className="text-sm text-secondary">{ta('noData')}</p>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-primary">{t('topCompanies')}</h3>
      <div className="space-y-3">
        {companies.map((company) => (
          <div
            key={company.id}
            className="flex items-center justify-between gap-4 rounded-xl surface-card border p-4 shadow-sm"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <AvatarImage
                src={company.logo}
                name={company.name}
                variant="rounded"
                className="h-14 w-14 shrink-0 shadow-md ring-1 ring-slate-100"
              />
              <div className="min-w-0 text-start">
                <p className="truncate font-semibold text-primary">{company.name}</p>
                <p className="text-sm text-secondary">
                  {ta('reviewerCountLabel', { count: company.reviewCount })}
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <StarRating value={company.ratingAverage} size="sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
