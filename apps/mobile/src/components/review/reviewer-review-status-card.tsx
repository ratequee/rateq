import { StarRating } from '@/components/ui/star-rating';
import { getFontFamily } from '@/i18n';
import { REVIEW_STATUS_CONFIG } from '@/lib/review-status-config';
import type { ReviewPublic } from '@rateq/types';
import { ReviewStatus } from '@rateq/types';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

interface ReviewerReviewStatusCardProps {
  review: ReviewPublic;
  bannerMessage?: string;
  showReviewPreview?: boolean;
}

export function ReviewerReviewStatusCard({
  review,
  bannerMessage,
  showReviewPreview = true,
}: ReviewerReviewStatusCardProps) {
  const { t } = useTranslation();
  const config = REVIEW_STATUS_CONFIG[review.status];
  const showResolutionHint = review.status === ReviewStatus.RESOLUTION_PENDING;

  return (
    <View className={`overflow-hidden rounded-3xl border ${config.containerClass}`}>
      {bannerMessage ? (
        <View className="border-b border-black/5 px-5 py-3 dark:border-white/10">
          <Text
            className="text-sm leading-5 text-ink dark:text-white/90"
            style={{ fontFamily: getFontFamily('medium') }}
          >
            {bannerMessage}
          </Text>
        </View>
      ) : null}

      <View className="flex-row gap-3 p-5">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-white/70 dark:bg-white/10">
          <Ionicons name={config.icon} size={22} color={config.iconColor} />
        </View>

        <View className="min-w-0 flex-1">
          <Text
            className="text-base font-bold text-ink dark:text-white"
            style={{ fontFamily: getFontFamily('bold') }}
          >
            {t('review.myReviewTitle')}
          </Text>
          <Text
            className="mt-1 text-sm leading-5 text-ink/80 dark:text-white/80"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {t(config.messageKey)}
          </Text>

          {showReviewPreview ? (
            <View className="mt-4 rounded-2xl border border-white/60 bg-white/80 p-4 dark:border-dm-border dark:bg-dm-surface">
              <View className="flex-row flex-wrap items-center gap-2">
                <StarRating value={review.rating} size={18} />
                <Text
                  className="text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-white/60"
                  style={{ fontFamily: getFontFamily('semibold') }}
                >
                  {t(config.labelKey)}
                </Text>
              </View>
              {review.title ? (
                <Text
                  className="mt-2 text-sm font-semibold text-ink dark:text-white"
                  style={{ fontFamily: getFontFamily('semibold') }}
                >
                  {review.title}
                </Text>
              ) : null}
              <Text
                className="mt-2 text-sm leading-5 text-ink/80 dark:text-white/75"
                style={{ fontFamily: getFontFamily('regular') }}
                numberOfLines={4}
              >
                {review.content}
              </Text>
            </View>
          ) : null}

          {showResolutionHint ? (
            <Text
              className="mt-3 text-xs leading-5 text-sky-800 dark:text-sky-200"
              style={{ fontFamily: getFontFamily('regular') }}
            >
              {t('review.resolutionHint')}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
