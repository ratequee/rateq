import type { ReviewPublic } from '@rateq/types';
import { StarRating } from '@/components/ui/star-rating';
import Image from 'next/image';

interface CompanyReviewQuoteCardProps {
  review: ReviewPublic;
  authorName: string;
}

export function CompanyReviewQuoteCard({ review, authorName }: CompanyReviewQuoteCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <StarRating value={review.rating} size="md" />
      <blockquote className="mt-4 text-sm leading-relaxed text-ink-muted sm:text-base">
        &ldquo;{review.content}&rdquo;
      </blockquote>
      <footer className="mt-6 flex items-center gap-3">
        <Image
          src="/images/author.svg"
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0">
          <p className="font-semibold text-ink">{authorName}</p>
          <p className="text-sm text-ink-muted">{review.title}</p>
        </div>
      </footer>
    </article>
  );
}
