'use client';

import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/ui/star-rating';
import { cn } from '@/lib/utils';
import type { ReviewPublic } from '@rateq/types';
import { ReviewStatus } from '@rateq/types';
import { CheckCircle2, Clock3, MessageSquareWarning, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

interface ReviewerReviewStatusCardProps {
  review: ReviewPublic;
  className?: string;
  compact?: boolean;
}

const statusConfig: Record<
  ReviewStatus,
  { messageKey: string; className: string; icon: typeof Clock3 }
> = {
  [ReviewStatus.PENDING]: {
    messageKey: 'myReviewPending',
    className: 'border-amber-200 bg-amber-50 text-amber-950',
    icon: Clock3,
  },
  [ReviewStatus.RESOLUTION_PENDING]: {
    messageKey: 'myReviewResolutionPending',
    className: 'border-sky-200 bg-sky-50 text-sky-950',
    icon: MessageSquareWarning,
  },
  [ReviewStatus.APPROVED]: {
    messageKey: 'myReviewApproved',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    icon: CheckCircle2,
  },
  [ReviewStatus.REJECTED]: {
    messageKey: 'myReviewRejected',
    className: 'border-red-200 bg-red-50 text-red-950',
    icon: XCircle,
  },
};

export function ReviewerReviewStatusCard({
  review,
  className,
  compact = false,
}: ReviewerReviewStatusCardProps) {
  const t = useTranslations('review');
  const config = statusConfig[review.status];
  const Icon = config.icon;
  const showResolutionActions = review.status === ReviewStatus.RESOLUTION_PENDING;

  return (
    <div className={cn('rounded-2xl border p-5 shadow-sm', config.className, className)}>
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{t('myReviewTitle')}</p>
          <p className="mt-1 text-sm leading-relaxed opacity-90">{t(config.messageKey)}</p>

          {!compact ? (
            <div className="mt-4 rounded-xl border border-white/60 bg-white/70 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StarRating value={review.rating} size="sm" />
                <span className="text-xs font-medium uppercase tracking-wide opacity-80">
                  {t(`statusLabel.${review.status}`)}
                </span>
              </div>
              {review.title ? <p className="mt-2 text-sm font-semibold">{review.title}</p> : null}
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed opacity-90">
                {review.content}
              </p>
            </div>
          ) : null}

          {showResolutionActions ? (
            <div className="mt-4">
              <Link href="/dashboard/reviewer/reviews">
                <Button type="button" size="sm" variant="outline" className="bg-white/80">
                  {t('myReviewManageResolution')}
                </Button>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
