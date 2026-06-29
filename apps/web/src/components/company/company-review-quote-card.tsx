'use client';

import type { ReviewPublic } from '@rateq/types';
import { ReviewStatus } from '@rateq/types';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { ReportReviewButton } from '@/components/review/report-review-button';
import { useAuth } from '@/components/providers/auth-provider';
import { getReviewAuthorInitial, getReviewAuthorName } from '@/lib/review-author';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface CompanyReviewQuoteCardProps {
  review: ReviewPublic;
  authorName?: string;
}

export function CompanyReviewQuoteCard({ review, authorName }: CompanyReviewQuoteCardProps) {
  const t = useTranslations('review');
  const tp = useTranslations('companyPage');
  const { user } = useAuth();
  const name = authorName ?? getReviewAuthorName(review.author, 'Reviewer');
  const showStatus = review.status !== ReviewStatus.APPROVED;
  const locale = typeof document !== 'undefined' ? document.documentElement.lang : 'en';
  const canReport = review.status === ReviewStatus.APPROVED && (!user || user.id !== review.userId);

  const replyDate =
    review.reply &&
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
      new Date(review.reply.createdAt),
    );

  return (
    <article
      className={cn(
        'rounded-2xl border bg-white p-6 shadow-sm dark:bg-dm-surface sm:p-8',
        showStatus
          ? 'border-amber-200 ring-1 ring-amber-100 dark:border-amber-900 dark:ring-amber-950'
          : 'border-default',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StarRating value={review.rating} size="md" />
        {showStatus ? (
          <Badge
            className={cn(
              review.status === ReviewStatus.PENDING
                ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300'
                : review.status === ReviewStatus.RESOLUTION_PENDING
                  ? 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300'
                  : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400',
            )}
          >
            {t(`statusLabel.${review.status}`)}
          </Badge>
        ) : null}
      </div>
      <blockquote className="mt-4 text-sm leading-relaxed text-primary sm:text-base">
        &ldquo;{review.content}&rdquo;
      </blockquote>
      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {review.author?.avatarUrl ? (
            <img
              src={review.author.avatarUrl}
              alt=""
              className="h-12 w-12 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-600 dark:bg-brand-950 dark:text-brand-300">
              {getReviewAuthorInitial(name)}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-primary">{name}</p>
            <p className="text-sm text-secondary">{review.title}</p>
          </div>
        </div>
        {canReport ? <ReportReviewButton reviewId={review.id} /> : null}
      </footer>

      {review.reply ? (
        <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50/50 p-4 dark:border-brand-900/60 dark:bg-brand-950/30">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">
              {tp('companyReply')}
            </p>
            {replyDate ? <p className="text-xs text-secondary">{replyDate}</p> : null}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-primary">{review.reply.content}</p>
        </div>
      ) : null}
    </article>
  );
}
