'use client';

import type { ReviewPublic } from '@rateq/types';
import { ReviewStatus } from '@rateq/types';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface CompanyReviewCardProps {
  review: ReviewPublic;
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));
}

export function CompanyReviewCard({ review }: CompanyReviewCardProps) {
  const t = useTranslations('review');
  const tp = useTranslations('companyPage');
  const locale = typeof document !== 'undefined' ? document.documentElement.lang : 'en';

  const authorLabel = review.author?.email.split('@')[0] ?? tp('anonymousReviewer');

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold uppercase text-brand-500"
          aria-hidden
        >
          {authorLabel.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-ink">{authorLabel}</p>
              <p className="text-xs text-ink-muted">{formatDate(review.createdAt, locale)}</p>
            </div>
            {review.status !== ReviewStatus.APPROVED && (
              <Badge
                className={cn(
                  review.status === ReviewStatus.PENDING
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-red-200 bg-red-50 text-red-700',
                )}
              >
                {review.status === ReviewStatus.PENDING ? t('pending') : review.status}
              </Badge>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StarRating value={review.rating} size="sm" />
            <h3 className="font-medium text-ink">{review.title}</h3>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{review.content}</p>

          {review.reply && (
            <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                {tp('companyReply')}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink">{review.reply.content}</p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
