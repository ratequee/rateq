import type { ReviewPublic } from '@rateq/types';
import { StarRating } from '@/components/ui/star-rating';
import { getReviewAuthorInitial, getReviewAuthorName } from '@/lib/review-author';

interface CompanyReviewQuoteCardProps {
  review: ReviewPublic;
  authorName?: string;
}

export function CompanyReviewQuoteCard({ review, authorName }: CompanyReviewQuoteCardProps) {
  const name = authorName ?? getReviewAuthorName(review.author, 'Reviewer');

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <StarRating value={review.rating} size="md" />
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
