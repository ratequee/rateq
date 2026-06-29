'use client';

import { AvatarImage } from '@/components/ui/avatar-image';
import { StarRating } from '@/components/ui/star-rating';
import { companiesApi } from '@/lib/api';
import { Link } from '@/i18n/routing';
import type { CompanyPublic } from '@rateq/types';
import { Heart, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export function ReviewerFavoriteCompaniesList() {
  const t = useTranslations('reviewerFavorites');
  const [companies, setCompanies] = useState<CompanyPublic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void companiesApi
      .listFavorites()
      .then(setCompanies)
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!companies.length) {
    return (
      <div className="rounded-2xl border border-subtle surface-card p-5 shadow-sm">
        <h3 className="text-lg font-bold text-primary">{t('favoriteCompaniesTitle')}</h3>
        <p className="mt-2 text-sm text-secondary">{t('favoriteCompaniesEmpty')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-subtle surface-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Heart className="h-5 w-5 fill-brand-500 text-brand-500" />
        <h3 className="text-lg font-bold text-primary">{t('favoriteCompaniesTitle')}</h3>
      </div>
      <div className="space-y-3">
        {companies.map((company) => (
          <Link
            key={company.id}
            href={`/companies/${company.slug}`}
            className="flex items-center justify-between gap-4 rounded-xl border border-subtle p-4 transition-colors hover:border-brand-100 hover:bg-brand-50/40 dark:hover:border-dm-border dark:hover:bg-dm-elevated"
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
                  {company.city}, {company.country}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-end">
              <StarRating value={company.ratingAverage} size="sm" />
              <p className="mt-1 text-xs text-secondary">
                {t('favoriteReviewCount', { count: company.reviewCount })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
