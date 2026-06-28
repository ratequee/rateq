'use client';

import { cn } from '@/lib/utils';
import { ReviewReplyStatus } from '@rateq/types';
import { useTranslations } from 'next-intl';

const replyStatusStyles: Record<ReviewReplyStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  APPROVED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  REJECTED: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400',
};

interface ReviewReplyStatusBadgeProps {
  status: ReviewReplyStatus;
  className?: string;
}

export function ReviewReplyStatusBadge({ status, className }: ReviewReplyStatusBadgeProps) {
  const t = useTranslations('dashboardReviews');

  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-medium',
        replyStatusStyles[status],
        className,
      )}
    >
      {t(`replyStatus.${status}`)}
    </span>
  );
}
