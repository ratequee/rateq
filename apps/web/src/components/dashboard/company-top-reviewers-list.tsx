'use client';

import { AvatarImage } from '@/components/ui/avatar-image';
import { StarRating } from '@/components/ui/star-rating';
import type { CompanyTopReviewer } from '@rateq/types';
import { useTranslations } from 'next-intl';

interface CompanyTopReviewersListProps {
  reviewers: CompanyTopReviewer[];
}

export function CompanyTopReviewersList({ reviewers }: CompanyTopReviewersListProps) {
  const t = useTranslations('dashboardShell');
  const tc = useTranslations('companyOverview');

  if (!reviewers.length) {
    return <p className="text-sm text-secondary">{tc('noData')}</p>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-primary">{t('topReviewers')}</h3>
      <div className="space-y-3">
        {reviewers.map((reviewer) => (
          <div
            key={reviewer.id}
            className="flex items-center justify-between gap-4 rounded-xl surface-card border p-4 shadow-sm"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <AvatarImage
                src={reviewer.avatarUrl}
                name={reviewer.name}
                className="h-14 w-14 shrink-0 shadow-md ring-1 ring-slate-100"
              />
              <div className="min-w-0 text-start">
                <p className="truncate font-semibold text-primary">{reviewer.name}</p>
                <p className="text-sm text-secondary">
                  {tc('reviewCountLabel', { count: reviewer.reviewCount })}
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <StarRating value={reviewer.ratingAverage} size="sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
