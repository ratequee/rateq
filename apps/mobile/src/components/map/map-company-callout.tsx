import { StarRating } from '@/components/ui/star-rating';
import { useAppDirection } from '@/hooks/use-app-direction';
import { getFontFamily } from '@/i18n';
import { cn } from '@/lib/cn';
import type { NearbyCompany } from '@/lib/nearby-locations';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View } from 'react-native';

interface MapCompanyCalloutProps {
  company: NearbyCompany;
  onClose: () => void;
}

export function MapCompanyCallout({ company, onClose }: MapCompanyCalloutProps) {
  const { t, i18n } = useTranslation();
  const { isRtl, textStyle } = useAppDirection();
  const locale = i18n.language === 'ar' ? 'ar' : 'en';
  const displayName = locale === 'ar' && company.nameAr?.trim() ? company.nameAr : company.name;

  return (
    <View className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl dark:border-dm-border dark:bg-dm-elevated">
      <Pressable
        onPress={onClose}
        className="absolute end-2 top-2 z-10 h-8 w-8 items-center justify-center rounded-full"
        accessibilityRole="button"
        accessibilityLabel={t('map.closePopup')}
      >
        <Ionicons name="close" size={18} color="#64748b" />
      </Pressable>

      <View className={cn('flex-row items-start gap-3 pe-8', isRtl && 'flex-row-reverse')}>
        {company.logo ? (
          <Image
            source={{ uri: company.logo }}
            className="-mt-1 h-20 w-20 rounded-3xl"
            resizeMode="cover"
          />
        ) : (
          <View className="-mt-1 h-20 w-20 items-center justify-center rounded-3xl bg-brand-100">
            <Text
              className="text-lg font-bold text-brand-500"
              style={{ fontFamily: getFontFamily('bold') }}
            >
              {company.name.charAt(0)}
            </Text>
          </View>
        )}

        <View className="min-w-0 flex-1">
          <Text
            className="text-base font-semibold text-ink dark:text-white"
            style={[{ fontFamily: getFontFamily('semibold') }, textStyle]}
            numberOfLines={2}
          >
            {displayName}
          </Text>
          <Text
            className="mt-1 text-xs text-ink-muted dark:text-white/75"
            style={[{ fontFamily: getFontFamily('regular') }, textStyle]}
          >
            {company.city} - {company.country}
          </Text>
        </View>
      </View>

      <View
        className={cn(
          'mt-3 flex-row items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-dm-border',
          isRtl && 'flex-row-reverse',
        )}
      >
        <View className={cn('flex-row items-center gap-2', isRtl && 'flex-row-reverse')}>
          <Text
            className="text-lg font-bold text-ink dark:text-white"
            style={{ fontFamily: getFontFamily('bold') }}
          >
            {company.ratingAverage.toFixed(1)}
          </Text>
          <StarRating value={company.ratingAverage} size={12} />
          <Text
            className="text-xs text-ink-muted dark:text-white/70"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            ({company.reviewCount.toLocaleString()} {t('home.reviewsLabel')})
          </Text>
        </View>

        <Link href={`/company/${company.slug}`} asChild>
          <Pressable className="h-9 w-9 items-center justify-center rounded-full bg-gold-300">
            <Ionicons name={isRtl ? 'arrow-back' : 'arrow-forward'} size={16} color="#ffffff" />
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
