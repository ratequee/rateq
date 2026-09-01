import { StarRating } from '@/components/ui/star-rating';
import { useAppDirection } from '@/hooks/use-app-direction';
import { getFontFamily, getCurrentLocale } from '@/i18n';
import { getLocalizedCompanyName } from '@/lib/company-display';
import type { TrustedBannerItem } from '@rateq/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  Image,
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

const SLIDE_INTERVAL_MS = 7000;
const HORIZONTAL_PADDING = 16;
const CARD_GAP = 12;

interface TrustedHomeBannerProps {
  items: TrustedBannerItem[];
}

export function TrustedHomeBanner({ items }: TrustedHomeBannerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { textStyle, isRtl } = useAppDirection();
  const locale = getCurrentLocale();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const cardWidth = Dimensions.get('window').width - HORIZONTAL_PADDING * 2;

  const scrollToIndex = useCallback(
    (index: number, animated = true) => {
      const x = index * (cardWidth + CARD_GAP);
      scrollRef.current?.scrollTo({ x, animated });
      setActiveIndex(index);
    },
    [cardWidth],
  );

  useEffect(() => {
    if (items.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + 1) % items.length;
        scrollToIndex(next);
        return next;
      });
    }, SLIDE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [items.length, scrollToIndex]);

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / (cardWidth + CARD_GAP));
    setActiveIndex(Math.max(0, Math.min(index, items.length - 1)));
  };

  if (items.length === 0) return null;

  return (
    <View className="mt-2">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        decelerationRate="fast"
        snapToInterval={cardWidth + CARD_GAP}
        snapToAlignment="start"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING, gap: CARD_GAP }}
      >
        {items.map((item) => {
          const companyName = getLocalizedCompanyName(item.company, locale);
          const review = item.review;
          const authorName = review?.author?.displayName ?? t('home.testimonialAuthor');
          const backgroundUri = item.company.coverUrl ?? item.company.logo ?? undefined;

          return (
            <Pressable
              key={item.company.id}
              onPress={() => router.push(`/company/${item.company.slug}`)}
              style={{ width: cardWidth }}
              className="overflow-hidden rounded-3xl"
            >
              {backgroundUri ? (
                <ImageBackground source={{ uri: backgroundUri }} className="min-h-[220px]">
                  <BannerContent
                    review={review}
                    authorName={authorName}
                    companyName={companyName}
                    logo={item.company.logo}
                    city={item.company.city}
                    country={item.company.country}
                    textStyle={textStyle}
                    isRtl={isRtl}
                    t={t}
                  />
                </ImageBackground>
              ) : (
                <View className="min-h-[220px] bg-brand-600">
                  <BannerContent
                    review={review}
                    authorName={authorName}
                    companyName={companyName}
                    logo={item.company.logo}
                    city={item.company.city}
                    country={item.company.country}
                    textStyle={textStyle}
                    isRtl={isRtl}
                    t={t}
                  />
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {items.length > 1 ? (
        <View className="mt-3 flex-row items-center justify-center gap-1.5">
          {items.map((item, index) => (
            <View
              key={item.company.id}
              className={`h-1.5 rounded-full ${index === activeIndex ? 'w-5 bg-brand-500' : 'w-1.5 bg-slate-300 dark:bg-white/30'}`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function BannerContent({
  review,
  authorName,
  companyName,
  logo,
  city,
  country,
  textStyle,
  isRtl,
  t,
}: {
  review: TrustedBannerItem['review'];
  authorName: string;
  companyName: string;
  logo: string | null;
  city: string;
  country: string;
  textStyle: object;
  isRtl: boolean;
  t: (key: string) => string;
}) {
  return (
    <View className="flex-1 justify-between bg-black/45 p-5">
      <View>
        <View className="mb-2 flex-row items-center gap-1.5">
          <Ionicons name="shield-checkmark" size={14} color="#f5d565" />
          <Text
            className="text-xs font-semibold uppercase tracking-wide text-gold-300"
            style={{ fontFamily: getFontFamily('semibold', t('home.trustedBadge')) }}
          >
            {t('home.trustedBadge')}
          </Text>
        </View>

        {review ? (
          <>
            <Text
              className="text-sm leading-5 text-white"
              style={[{ fontFamily: getFontFamily('regular', review.content) }, textStyle]}
              numberOfLines={3}
            >
              “{review.content}”
            </Text>
            <View
              className="mt-2 flex-row items-center gap-2"
              style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}
            >
              <StarRating value={review.rating} size={12} />
              <Text
                className="text-xs text-white/85"
                style={{ fontFamily: getFontFamily('medium', authorName) }}
                numberOfLines={1}
              >
                {authorName}
              </Text>
            </View>
          </>
        ) : null}
      </View>

      <View
        className="mt-4 flex-row items-center gap-3 rounded-2xl bg-white/10 p-3"
        style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}
      >
        {logo ? (
          <Image
            source={{ uri: logo }}
            className="h-11 w-11 rounded-xl bg-white"
            resizeMode="cover"
          />
        ) : (
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-white/20">
            <Text
              className="text-lg font-bold text-white"
              style={{ fontFamily: getFontFamily('bold', companyName) }}
            >
              {companyName.charAt(0)}
            </Text>
          </View>
        )}
        <View className="min-w-0 flex-1">
          <Text
            className="text-base font-semibold text-white"
            style={[{ fontFamily: getFontFamily('semibold', companyName) }, textStyle]}
            numberOfLines={1}
          >
            {companyName}
          </Text>
          <Text
            className="text-xs text-white/80"
            style={{ fontFamily: getFontFamily('regular', `${city}, ${country}`) }}
            numberOfLines={1}
          >
            {city}, {country}
          </Text>
        </View>
      </View>
    </View>
  );
}
