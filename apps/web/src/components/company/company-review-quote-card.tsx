import type { ReviewPublic } from '@rateq/types';
import { ReviewStatus } from '@rateq/types';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { getReviewAuthorInitial, getReviewAuthorName } from '@/lib/review-author';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface CompanyReviewQuoteCardProps {
  review: ReviewPublic;
  authorName?: string;
}

export function CompanyReviewQuoteCard({ review, authorName }: CompanyReviewQuoteCardProps) {
  const t = useTranslations('review');
  const name = authorName ?? getReviewAuthorName(review.author, 'Reviewer');
  const showStatus = review.status !== ReviewStatus.APPROVED;

  return (
    <article
      className={cn(
        'rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-900 sm:p-8',
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
      <footer className="mt-6 flex items-center gap-3">
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
      </footer>
    </article>
  );
}
