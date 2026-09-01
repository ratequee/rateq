import { StarRating } from '@/components/ui/star-rating';
import { useAppDirection } from '@/hooks/use-app-direction';
import { getFontFamily } from '@/i18n';
import type { ReviewPublic } from '@rateq/types';
import { Image, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

interface HomeTestimonialCardProps {
  review: ReviewPublic;
}

export function HomeTestimonialCard({ review }: HomeTestimonialCardProps) {
  const { t } = useTranslation();
  const { textStyle, isRtl, labelContainerStyle } = useAppDirection();
  const authorName = review.author?.displayName ?? t('home.testimonialAuthor');
  const companyName = review.company?.name ?? t('home.testimonialCompany');

  return (
    <View
      className="w-[280px] rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-dm-border dark:bg-dm-elevated"
      style={{ marginEnd: 16 }}
    >
      <View className="items-center gap-3" style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        {review.author?.avatarUrl ? (
          <Image source={{ uri: review.author.avatarUrl }} className="h-12 w-12 rounded-full" />
        ) : (
          <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-100">
            <Text
              className="font-semibold text-brand-500"
              style={{ fontFamily: getFontFamily('semibold', authorName) }}
            >
              {authorName.charAt(0)}
            </Text>
          </View>
        )}
        <View className="flex-1 gap-0.5">
          <View style={labelContainerStyle}>
            <Text
              className="text-sm font-semibold text-ink dark:text-white"
              style={[{ fontFamily: getFontFamily('semibold', authorName) }, textStyle]}
              numberOfLines={1}
            >
              {authorName}
            </Text>
          </View>
          <View style={labelContainerStyle}>
            <Text
              className="text-xs text-ink-muted dark:text-white/70"
              style={[{ fontFamily: getFontFamily('regular', companyName) }, textStyle]}
              numberOfLines={1}
            >
              {companyName}
            </Text>
          </View>
        </View>
      </View>
      <View className={isRtl ? 'mt-3 items-end' : 'mt-3 items-start'}>
        <StarRating value={review.rating} size={14} />
      </View>
      <Text
        className="mt-3 text-sm leading-5 text-ink-muted dark:text-white/80"
        style={[
          { fontFamily: getFontFamily('regular', review.content), width: '100%', lineHeight: 22 },
          textStyle,
        ]}
        numberOfLines={4}
      >
        {review.content}
      </Text>
    </View>
  );
}
