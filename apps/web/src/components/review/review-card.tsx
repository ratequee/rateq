import type { ReviewPublic } from '@rateq/types';
import { ReviewStatus } from '@rateq/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { useTranslations } from 'next-intl';

interface ReviewCardProps {
  review: ReviewPublic;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const t = useTranslations('review');

  const statusColors: Record<ReviewStatus, string> = {
    [ReviewStatus.APPROVED]: 'border-green-200 bg-green-50 text-green-700',
    [ReviewStatus.PENDING]: 'border-amber-200 bg-amber-50 text-amber-700',
    [ReviewStatus.REJECTED]: 'border-red-200 bg-red-50 text-red-700',
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <StarRating value={review.rating} size="sm" />
            <span className="font-medium text-slate-900">{review.title}</span>
          </div>
          {review.status !== ReviewStatus.APPROVED && (
            <Badge className={statusColors[review.status]}>
              {review.status === ReviewStatus.PENDING ? t('pending') : review.status}
            </Badge>
          )}
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">{review.content}</p>
        {review.author && (
          <p className="text-xs text-slate-400">{review.author.email}</p>
        )}
        {review.reply && (
          <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-500 mb-1">Company response</p>
            <p className="text-sm text-slate-700">{review.reply.content}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
