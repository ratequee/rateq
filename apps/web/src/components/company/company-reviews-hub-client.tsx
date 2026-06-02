'use client';

import type { ReviewPublic } from '@rateq/types';
import { CompanyReviewQuoteCard } from '@/components/company/company-review-quote-card';
import { ReviewsPagination } from '@/components/company/reviews-pagination';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

const REVIEWS_PER_PAGE = 2;

interface CompanyReviewsHubClientProps {
  reviews: ReviewPublic[];
  topMentions: string[];
}

function authorLabel(review: ReviewPublic, fallback: string) {
  if (!review.author?.email) return fallback;
  const local = review.author.email.split('@')[0];
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function CompanyReviewsHubClient({ reviews, topMentions }: CompanyReviewsHubClientProps) {
  const t = useTranslations('companyPage.reviewsHub');
  const tp = useTranslations('companyPage');
  const [query, setQuery] = useState('');
  const [activeMention, setActiveMention] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return reviews.filter((review) => {
      const matchesQuery =
        !normalizedQuery ||
        review.content.toLowerCase().includes(normalizedQuery) ||
        review.title.toLowerCase().includes(normalizedQuery);

      const matchesMention =
        !activeMention ||
        review.title.toLowerCase().includes(activeMention.toLowerCase()) ||
        review.content.toLowerCase().includes(activeMention.toLowerCase());

      return matchesQuery && matchesMention;
    });
  }, [reviews, query, activeMention]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / REVIEWS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * REVIEWS_PER_PAGE;
  const pageReviews = filtered.slice(pageStart, pageStart + REVIEWS_PER_PAGE);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const handleMentionClick = (mention: string) => {
    setActiveMention((current) => (current === mention ? null : mention));
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
  };

  return (
    <div className="min-w-0">
      <div className="relative">
        <Search
          className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder={t('searchPlaceholder')}
          className="h-12 rounded-full border-slate-200 ps-11 text-base shadow-sm"
        />
      </div>

      {topMentions.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-ink">{t('topMentions')}</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {topMentions.map((mention) => (
              <button
                key={mention}
                type="button"
                onClick={() => handleMentionClick(mention)}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                  activeMention === mention
                    ? 'border-brand-500 bg-brand-50 text-brand-600'
                    : 'border-transparent bg-slate-100 text-ink-muted hover:bg-slate-200',
                )}
              >
                {mention}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 space-y-5">
        {pageReviews.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-ink-muted">
            {t('noResults')}
          </p>
        ) : (
          pageReviews.map((review) => (
            <CompanyReviewQuoteCard
              key={review.id}
              review={review}
              authorName={authorLabel(review, tp('anonymousReviewer'))}
            />
          ))
        )}
      </div>

      <ReviewsPagination
        className="mt-6"
        page={safePage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
