import { StarRating } from '@/components/ui/star-rating';
import { getFontFamily } from '@/i18n';
import { cn } from '@/lib/cn';
import { getReviewAuthorName } from '@/lib/review-author';
import { REVIEW_STATUS_BADGE_STYLES } from '@/lib/review-status-badge-styles';
import type { ReviewPublic } from '@rateq/types';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

interface ActivityReviewCardProps {
  review: ReviewPublic;
  viewMode?: 'submitted' | 'received';
}

export function ActivityReviewCard({ review, viewMode = 'submitted' }: ActivityReviewCardProps) {
  const { t } = useTranslation();
  const companyName = review.company?.name ?? t('home.testimonialCompany');
  const companySlug = review.company?.slug;
  const reviewerName = getReviewAuthorName(review.author, t('company.anonymousReviewer'));
  const headerLabel = viewMode === 'received' ? reviewerName : companyName;
  const statusLabel = t(`myReviews.status.${review.status}`);
  const badgeStyle = REVIEW_STATUS_BADGE_STYLES[review.status];
  const dateLabel = new Date(review.createdAt).toLocaleDateString();

  return (
    <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-dm-border dark:bg-dm-elevated">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          {viewMode === 'submitted' && companySlug ? (
            <Link href={`/company/${companySlug}`} asChild>
              <Pressable>
                <Text
                  className="text-sm font-semibold text-brand-500"
                  style={{ fontFamily: getFontFamily('semibold', headerLabel), lineHeight: 20 }}
                  numberOfLines={2}
                >
                  {headerLabel}
                </Text>
              </Pressable>
            </Link>
          ) : (
            <Text
              className={`text-sm font-semibold ${viewMode === 'received' ? 'text-ink dark:text-white' : 'text-brand-500'}`}
              style={{ fontFamily: getFontFamily('semibold', headerLabel), lineHeight: 20 }}
              numberOfLines={2}
            >
              {headerLabel}
            </Text>
          )}
          <Text
            className="mt-2.5 text-base font-semibold text-ink dark:text-white"
            style={{ fontFamily: getFontFamily('semibold', review.title), lineHeight: 24 }}
            numberOfLines={2}
          >
            {review.title}
          </Text>
        </View>
        <View className={cn('shrink-0 rounded-full px-2.5 py-1', badgeStyle.container)}>
          <Text
            className={cn('text-[11px] font-semibold', badgeStyle.text)}
            style={{ fontFamily: getFontFamily('semibold', statusLabel), lineHeight: 16 }}
          >
            {statusLabel}
          </Text>
        </View>
      </View>

      <View className="mt-3.5 flex-row items-center gap-2">
        <StarRating value={review.rating} size={14} />
        <Text
          className="text-xs text-ink-muted dark:text-white/60"
          style={{ fontFamily: getFontFamily('regular', dateLabel) }}
        >
          {dateLabel}
        </Text>
      </View>

      <Text
        className="mt-3.5 text-sm leading-6 text-ink-muted dark:text-white/80"
        style={{ fontFamily: getFontFamily('regular', review.content) }}
        numberOfLines={4}
      >
        {review.content}
      </Text>

      {review.reply ? (
        <View className="mt-3 rounded-xl border border-brand-100 bg-brand-50/60 p-3 dark:border-brand-900/40 dark:bg-brand-950/20">
          <Text
            className="text-xs font-semibold text-brand-600 dark:text-brand-300"
            style={{ fontFamily: getFontFamily('semibold', t('myReviews.companyResponse')) }}
          >
            {t('myReviews.companyResponse')}
          </Text>
          <Text
            className="mt-1.5 text-sm leading-6 text-ink dark:text-white/90"
            style={{ fontFamily: getFontFamily('regular', review.reply.content) }}
            numberOfLines={3}
          >
            {review.reply.content}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
