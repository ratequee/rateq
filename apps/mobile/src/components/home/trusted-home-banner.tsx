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
  Image,
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  type TextStyle,
} from 'react-native';

const SLIDE_INTERVAL_MS = 7000;
const HORIZONTAL_INSET = 16;
const CARD_GAP = 12;
const CARD_HEIGHT = 252;

interface TrustedHomeBannerProps {
  items: TrustedBannerItem[];
}

function hasArabicScript(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

function contentTextStyle(text: string, isRtl: boolean): TextStyle {
  if (hasArabicScript(text)) {
    return { writingDirection: 'rtl', textAlign: 'right' };
  }
  if (isRtl) {
    return { writingDirection: 'rtl', textAlign: 'right' };
  }
  return { writingDirection: 'ltr', textAlign: 'left' };
}

export function TrustedHomeBanner({ items }: TrustedHomeBannerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { isRtl } = useAppDirection();
  const locale = getCurrentLocale();
  const { width: windowWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const cardWidth = windowWidth - HORIZONTAL_INSET * 2;

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
        decelerationRate="fast"
        snapToInterval={cardWidth + CARD_GAP}
        snapToAlignment="start"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        contentContainerStyle={{ paddingHorizontal: HORIZONTAL_INSET, gap: CARD_GAP }}
      >
        {items.map((item) => {
          const companyName = getLocalizedCompanyName(item.company, locale);
          const review = item.review;
          const authorName = review?.author?.displayName ?? t('home.testimonialAuthor');
          const backgroundUri = item.company.coverUrl ?? item.company.logo ?? undefined;
          const locationLine = `${item.company.city}, ${item.company.country}`;

          return (
            <Pressable
              key={item.company.id}
              onPress={() => router.push(`/company/${item.company.slug}`)}
              style={{ width: cardWidth, height: CARD_HEIGHT }}
              className="overflow-hidden rounded-3xl"
            >
              {backgroundUri ? (
                <ImageBackground
                  source={{ uri: backgroundUri }}
                  style={{ flex: 1 }}
                  resizeMode="cover"
                >
                  <BannerContent
                    review={review}
                    authorName={authorName}
                    companyName={companyName}
                    locationLine={locationLine}
                    logo={item.company.logo}
                    isRtl={isRtl}
                    t={t}
                  />
                </ImageBackground>
              ) : (
                <View className="flex-1 bg-brand-700">
                  <BannerContent
                    review={review}
                    authorName={authorName}
                    companyName={companyName}
                    locationLine={locationLine}
                    logo={item.company.logo}
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
  locationLine,
  logo,
  isRtl,
  t,
}: {
  review: TrustedBannerItem['review'];
  authorName: string;
  companyName: string;
  locationLine: string;
  logo: string | null;
  isRtl: boolean;
  t: (key: string) => string;
}) {
  const trustedLabel = t('home.trustedBadge');

  return (
    <View className="flex-1">
      <View className="absolute inset-0 bg-black/55" />
      <View
        className="absolute bottom-0 left-0 right-0"
        style={{ height: '72%', backgroundColor: 'rgba(0,0,0,0.42)' }}
      />

      <View className="flex-1 justify-between p-5">
        <View>
          <View className="self-start flex-row items-center gap-1.5 rounded-full border border-gold-300/40 bg-black/40 px-3 py-1.5">
            <Ionicons name="shield-checkmark" size={13} color="#f5d565" />
            <Text
              className="text-[11px] font-semibold uppercase tracking-wider text-gold-300"
              style={{ fontFamily: getFontFamily('semibold', trustedLabel), lineHeight: 14 }}
            >
              {trustedLabel}
            </Text>
          </View>

          {review ? (
            <View className="mt-4">
              <Text
                className="text-[15px] text-white"
                style={[
                  {
                    fontFamily: getFontFamily('regular', review.content),
                    lineHeight: 23,
                  },
                  contentTextStyle(review.content, isRtl),
                ]}
                numberOfLines={3}
              >
                &ldquo;{review.content}&rdquo;
              </Text>
              <View
                className="mt-3 flex-row items-center gap-2.5"
                style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}
              >
                <StarRating value={review.rating} size={13} />
                <View className="h-3 w-px bg-white/25" />
                <Text
                  className="flex-1 text-xs text-white/80"
                  style={[
                    { fontFamily: getFontFamily('medium', authorName), lineHeight: 16 },
                    contentTextStyle(authorName, isRtl),
                  ]}
                  numberOfLines={1}
                >
                  {authorName}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        <View
          className="flex-row items-center gap-3 rounded-2xl border border-white/12 bg-black/55 px-3.5 py-3.5"
          style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}
        >
          {logo ? (
            <Image
              source={{ uri: logo }}
              className="h-12 w-12 rounded-xl bg-white"
              resizeMode="cover"
            />
          ) : (
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <Text
                className="text-lg font-bold text-white"
                style={{ fontFamily: getFontFamily('bold', companyName) }}
              >
                {companyName.charAt(0)}
              </Text>
            </View>
          )}

          <View className="min-w-0 flex-1" style={{ gap: 6 }}>
            <Text
              className="text-[15px] font-semibold text-white"
              style={[
                { fontFamily: getFontFamily('semibold', companyName), lineHeight: 21 },
                contentTextStyle(companyName, isRtl),
              ]}
              numberOfLines={2}
            >
              {companyName}
            </Text>
            <Text
              className="text-xs text-white/65"
              style={[
                { fontFamily: getFontFamily('regular', locationLine), lineHeight: 17 },
                contentTextStyle(locationLine, isRtl),
              ]}
              numberOfLines={1}
            >
              {locationLine}
            </Text>
          </View>

          <Ionicons
            name={isRtl ? 'chevron-back' : 'chevron-forward'}
            size={18}
            color="rgba(255,255,255,0.45)"
          />
        </View>
      </View>
    </View>
  );
}
