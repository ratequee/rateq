import { StarRating } from '@/components/ui/star-rating';
import { getFontFamily } from '@/i18n';
import { getReviewAuthorInitial, getReviewAuthorName } from '@/lib/review-author';
import type { ReviewPublic } from '@rateq/types';
import { useTranslation } from 'react-i18next';
import { Image, Text, View } from 'react-native';

interface CompanyReviewQuoteCardProps {
  review: ReviewPublic;
}

export function CompanyReviewQuoteCard({ review }: CompanyReviewQuoteCardProps) {
  const { t } = useTranslation();
  const authorName = getReviewAuthorName(review.author, t('company.anonymousReviewer'));

  return (
    <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-dm-border dark:bg-dm-elevated">
      <StarRating value={review.rating} size={16} />

      <Text
        className="mt-4 text-sm leading-6 text-ink dark:text-white"
        style={{ fontFamily: getFontFamily('regular', review.content) }}
      >
        &ldquo;{review.content}&rdquo;
      </Text>

      <View className="mt-5 flex-row items-center gap-3 border-t border-slate-100 pt-4 dark:border-dm-border">
        {review.author?.avatarUrl ? (
          <Image
            source={{ uri: review.author.avatarUrl }}
            className="h-12 w-12 rounded-full"
            resizeMode="cover"
          />
        ) : (
          <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-100">
            <Text
              className="text-sm font-bold text-brand-500"
              style={{ fontFamily: getFontFamily('bold', authorName) }}
            >
              {getReviewAuthorInitial(authorName)}
            </Text>
          </View>
        )}
        <View className="min-w-0 flex-1">
          <Text
            className="font-semibold text-ink dark:text-white"
            style={{ fontFamily: getFontFamily('semibold', authorName) }}
          >
            {authorName}
          </Text>
          {review.title ? (
            <Text
              className="mt-1 text-sm text-ink-muted dark:text-white/70"
              style={{ fontFamily: getFontFamily('regular', review.title), lineHeight: 20 }}
              numberOfLines={2}
            >
              {review.title}
            </Text>
          ) : null}
        </View>
      </View>

      {review.reply ? (
        <View className="mt-4 rounded-xl border border-brand-100 bg-brand-50/60 p-4 dark:border-brand-900/40 dark:bg-brand-950/20">
          <Text
            className="text-xs font-semibold uppercase tracking-wide text-brand-600"
            style={{ fontFamily: getFontFamily('semibold', t('company.companyReply')) }}
          >
            {t('company.companyReply')}
          </Text>
          <Text
            className="mt-2 text-sm leading-5 text-ink dark:text-white/90"
            style={{ fontFamily: getFontFamily('regular', review.reply.content) }}
          >
            {review.reply.content}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
