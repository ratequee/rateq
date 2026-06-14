'use client';

import { StarRating } from '@/components/ui/star-rating';
import { Building2 } from 'lucide-react';
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
    return <p className="text-sm text-ink-muted">{ta('noData')}</p>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-ink">{t('topCompanies')}</h3>
      <div className="space-y-3">
        {companies.map((company) => (
          <div
            key={company.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-md ring-1 ring-slate-100">
                {company.logo ? (
                  <img src={company.logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-6 w-6 text-brand-500" aria-hidden />
                )}
              </div>
              <div className="min-w-0 text-start">
                <p className="truncate font-semibold text-ink">{company.name}</p>
                <p className="text-sm text-ink-muted">
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
