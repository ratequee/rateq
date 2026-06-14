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
        'rounded-2xl border bg-white p-6 shadow-sm sm:p-8',
        showStatus ? 'border-amber-200 ring-1 ring-amber-100' : 'border-slate-200',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StarRating value={review.rating} size="md" />
        {showStatus ? (
          <Badge
            className={cn(
              review.status === ReviewStatus.PENDING
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : review.status === ReviewStatus.RESOLUTION_PENDING
                  ? 'border-sky-200 bg-sky-50 text-sky-700'
                  : 'border-red-200 bg-red-50 text-red-700',
            )}
          >
            {t(`statusLabel.${review.status}`)}
          </Badge>
        ) : null}
      </div>
      <blockquote className="mt-4 text-sm leading-relaxed text-ink sm:text-base">
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
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-600">
            {getReviewAuthorInitial(name)}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-ink">{name}</p>
          <p className="text-sm text-ink-muted">{review.title}</p>
        </div>
      </footer>
    </article>
  );
}
