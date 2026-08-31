import { StarRating } from '@/components/ui/star-rating';
import { getLocalizedCategoryName } from '@/lib/category-label';
import { getFontFamily } from '@/i18n';
import type { CompanyPublic } from '@rateq/types';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View } from 'react-native';

interface FeaturedCompanyCardProps {
  company: CompanyPublic;
  layout?: 'carousel' | 'list';
}

export function FeaturedCompanyCard({ company, layout = 'carousel' }: FeaturedCompanyCardProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ar' ? 'ar' : 'en';
  const categoryLabel = getLocalizedCategoryName(company, locale);
  const isList = layout === 'list';

  return (
    <Link href={`/company/${company.slug}`} asChild>
      <Pressable
        className={
          isList
            ? 'mb-4 w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-dm-border dark:bg-dm-elevated'
            : 'mr-4 w-[300px] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-dm-border dark:bg-dm-elevated'
        }
      >
        <View className="relative h-40">
          {company.coverUrl ? (
            <Image
              source={{ uri: company.coverUrl }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="h-full w-full bg-brand-500" />
          )}
          <View className="absolute inset-0 bg-black/20" />
          <View className="absolute left-3 top-3 flex-row gap-2">
            {company.showVerifiedStamp ? (
              <View className="rounded-md bg-gold-300 px-2 py-1">
                <Text
                  className="text-[10px] font-semibold text-white"
                  style={{ fontFamily: getFontFamily('semibold') }}
                >
                  {t('home.badgeVerified')}
                </Text>
              </View>
            ) : null}
            {categoryLabel ? (
              <View className="rounded-md bg-white px-2 py-1">
                <Text
                  className="text-[10px] font-semibold text-brand-500"
                  style={{ fontFamily: getFontFamily('semibold') }}
                >
                  {categoryLabel}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View className="px-4 pb-4">
          <View className="flex-row items-center gap-3">
            {company.logo ? (
              <Image
                source={{ uri: company.logo }}
                className="-mt-8 h-16 w-16 rounded-2xl border-4 border-white bg-white"
              />
            ) : (
              <View className="-mt-8 h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-brand-100">
                <Text className="text-xl font-bold text-brand-500">{company.name.charAt(0)}</Text>
              </View>
            )}
            <View className="mt-1 flex-1">
              <Text
                className="text-base font-semibold text-ink dark:text-white"
                style={{ fontFamily: getFontFamily('semibold') }}
                numberOfLines={1}
              >
                {company.name}
              </Text>
              <Text
                className="text-xs text-ink-muted dark:text-white/75"
                style={{ fontFamily: getFontFamily('regular') }}
              >
                {company.city} - {company.country}
              </Text>
            </View>
          </View>

          <View className="mt-4 flex-row items-center justify-between border-t border-slate-100 pt-3 dark:border-dm-border">
            <View className="flex-row items-center gap-2">
              <Text
                className="text-xl font-bold text-ink dark:text-white"
                style={{ fontFamily: getFontFamily('bold') }}
              >
                {company.ratingAverage.toFixed(1)}
              </Text>
              <StarRating value={company.ratingAverage} size={14} />
            </View>
            <Text
              className="text-xs text-ink-muted dark:text-white/70"
              style={{ fontFamily: getFontFamily('regular') }}
            >
              ({company.reviewCount.toLocaleString()} {t('home.reviewsLabel')})
            </Text>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-gold-300">
              <Ionicons name="arrow-forward" size={16} color="#ffffff" />
            </View>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
