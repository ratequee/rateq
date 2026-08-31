import { StarRating } from '@/components/ui/star-rating';
import { getFontFamily } from '@/i18n';
import { cn } from '@/lib/cn';
import type { ReviewPublic } from '@rateq/types';
import { ReviewStatus } from '@rateq/types';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

const statusClasses: Record<ReviewStatus, string> = {
  [ReviewStatus.PENDING]: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  [ReviewStatus.RESOLUTION_PENDING]: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  [ReviewStatus.MODIFIED]:
    'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  [ReviewStatus.PROCEEDED]:
    'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  [ReviewStatus.WITHDRAWN]: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  [ReviewStatus.APPROVED]:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  [ReviewStatus.REJECTED]: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  [ReviewStatus.DELETED]: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

interface ActivityReviewCardProps {
  review: ReviewPublic;
}

export function ActivityReviewCard({ review }: ActivityReviewCardProps) {
  const { t } = useTranslation();
  const companyName = review.company?.name ?? t('home.testimonialCompany');
  const companySlug = review.company?.slug;

  return (
    <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-dm-border dark:bg-dm-elevated">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          {companySlug ? (
            <Link href={`/company/${companySlug}`} asChild>
              <Pressable>
                <Text
                  className="text-sm font-semibold text-brand-500"
                  style={{ fontFamily: getFontFamily('semibold'), lineHeight: 20 }}
                  numberOfLines={2}
                >
                  {companyName}
                </Text>
              </Pressable>
            </Link>
          ) : (
            <Text
              className="text-sm font-semibold text-ink dark:text-white"
              style={{ fontFamily: getFontFamily('semibold'), lineHeight: 20 }}
              numberOfLines={2}
            >
              {companyName}
            </Text>
          )}
          <Text
            className="mt-2 text-base font-semibold text-ink dark:text-white"
            style={{ fontFamily: getFontFamily('semibold'), lineHeight: 22 }}
            numberOfLines={2}
          >
            {review.title}
          </Text>
        </View>
        <View className={cn('rounded-full px-2.5 py-1', statusClasses[review.status])}>
          <Text
            className="text-[11px] font-medium"
            style={{ fontFamily: getFontFamily('medium'), lineHeight: 16 }}
          >
            {t(`myReviews.status.${review.status}`)}
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-center gap-2">
        <StarRating value={review.rating} size={14} />
        <Text
          className="text-xs text-ink-muted dark:text-white/60"
          style={{ fontFamily: getFontFamily('regular') }}
        >
          {new Date(review.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <Text
        className="mt-3 text-sm leading-5 text-ink-muted dark:text-white/80"
        style={{ fontFamily: getFontFamily('regular') }}
        numberOfLines={4}
      >
        {review.content}
      </Text>

      {review.reply ? (
        <View className="mt-3 rounded-xl border border-brand-100 bg-brand-50/60 p-3 dark:border-brand-900/40 dark:bg-brand-950/20">
          <Text
            className="text-xs font-semibold text-brand-600"
            style={{ fontFamily: getFontFamily('semibold') }}
          >
            {t('myReviews.companyResponse')}
          </Text>
          <Text
            className="mt-1 text-sm leading-5 text-ink dark:text-white/90"
            style={{ fontFamily: getFontFamily('regular') }}
            numberOfLines={3}
          >
            {review.reply.content}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
