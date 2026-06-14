'use client';

import type { CompanyPublic, ReviewPublic } from '@rateq/types';
import { ReviewStatus } from '@rateq/types';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { ReviewReplyForm } from '@/components/review/review-reply-form';
import { getReviewAuthorInitial, getReviewAuthorName } from '@/lib/review-author';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

interface CompanyReviewCardProps {
  review: ReviewPublic;
  company: Pick<CompanyPublic, 'id' | 'name' | 'city' | 'country' | 'logo'>;
  onReviewUpdated?: (review: ReviewPublic) => void;
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));
}

export function CompanyReviewCard({ review, company, onReviewUpdated }: CompanyReviewCardProps) {
  const t = useTranslations('review');
  const tp = useTranslations('companyPage');
  const locale = typeof document !== 'undefined' ? document.documentElement.lang : 'en';

  const authorName = getReviewAuthorName(review.author, tp('anonymousReviewer'));

  return (
    <article className="h-auto w-full self-start rounded-2xl border border-slate-100 bg-[#E5E5E5] p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-4">
        {review.author?.avatarUrl ? (
          <img
            src={review.author.avatarUrl}
            alt=""
            className="h-[60px] w-[60px] shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
          />
        ) : (
          <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full border-2 border-white bg-brand-100 text-xl font-bold text-brand-600 shadow-sm">
            {getReviewAuthorInitial(authorName)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-ink">{authorName}</p>
              <p className="text-xs text-ink-muted">{formatDate(review.createdAt, locale)}</p>
            </div>
            {review.status !== ReviewStatus.APPROVED && (
              <Badge
                className={cn(
                  review.status === ReviewStatus.PENDING
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : review.status === ReviewStatus.RESOLUTION_PENDING
                      ? 'border-sky-200 bg-sky-50 text-sky-700'
                      : 'border-red-200 bg-red-50 text-red-700',
                )}
              >
                {review.status === ReviewStatus.PENDING
                  ? t('pending')
                  : review.status === ReviewStatus.RESOLUTION_PENDING
                    ? t('resolutionPending')
                    : t('rejected')}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="w-full">
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StarRating value={review.rating} size="lg" />
          {review.title && <p className="text-sm font-semibold text-ink">{review.title}</p>}
        </div>

        <p className="mt-3 text-sm leading-relaxed text-ink">{review.content}</p>
        <hr className="my-4 border-t border-slate-400" />
        <div className="flex items-center gap-2">
          {company.logo ? (
            <img src={company.logo} alt="" className="h-14 w-14 rounded-xl object-cover" />
          ) : (
            <Image src="/images/company_avatar.svg" alt="" width={60} height={60} />
          )}
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-ink">{company.name}</p>
            <p className="text-sm text-ink-muted">
              {company.city}, {company.country}
            </p>
          </div>
        </div>

        {review.reply && (
          <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              {tp('companyReply')}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink">{review.reply.content}</p>
          </div>
        )}

        <ReviewReplyForm review={review} companyId={company.id} onReplied={onReviewUpdated} />
      </div>
    </article>
  );
}
