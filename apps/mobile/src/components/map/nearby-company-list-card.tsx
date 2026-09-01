import { useAppDirection } from '@/hooks/use-app-direction';
import { getLocalizedCompanyName } from '@/lib/company-display';
import { getFontFamily } from '@/i18n';
import { formatDistanceMeters, type NearbyCompany } from '@/lib/nearby-locations';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View } from 'react-native';

interface NearbyCompanyListCardProps {
  company: NearbyCompany;
}

export function NearbyCompanyListCard({ company }: NearbyCompanyListCardProps) {
  const { t, i18n } = useTranslation();
  const { isRtl } = useAppDirection();
  const locale = i18n.language === 'ar' ? 'ar' : 'en';
  const displayName = getLocalizedCompanyName(company, locale);

  const distance = formatDistanceMeters(
    company.distanceMeters,
    (value) => t('map.metersAway', { distance: value }),
    (value) => t('map.kmAway', { distance: value }),
  );

  return (
    <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-dm-border dark:bg-dm-elevated">
      <View className="flex-row items-center gap-3">
        {company.logo ? (
          <Image
            source={{ uri: company.logo }}
            className="h-12 w-12 rounded-full"
            resizeMode="cover"
          />
        ) : (
          <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-100">
            <Text
              className="text-sm font-bold text-brand-500"
              style={{ fontFamily: getFontFamily('bold', displayName) }}
            >
              {displayName.charAt(0)}
            </Text>
          </View>
        )}

        <Text
          className="min-w-0 flex-1 text-base font-semibold text-ink dark:text-white"
          style={{ fontFamily: getFontFamily('semibold', displayName), lineHeight: 22 }}
          numberOfLines={2}
        >
          {displayName}
        </Text>

        <Link href={`/company/${company.slug}`} asChild>
          <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-brand-500">
            <Ionicons name={isRtl ? 'arrow-back' : 'arrow-forward'} size={16} color="#ffffff" />
          </Pressable>
        </Link>
      </View>

      <View className="mt-3 flex-row items-center gap-3 border-t border-slate-100 pt-3 dark:border-dm-border">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="star" size={16} color="#fbbf24" />
          <Text
            className="text-sm font-bold text-ink dark:text-white"
            style={{ fontFamily: getFontFamily('bold') }}
          >
            {company.ratingAverage.toFixed(1)}
          </Text>
        </View>
        <View className="h-4 w-px bg-slate-200 dark:bg-dm-border" />
        <Text
          className="flex-1 text-sm text-ink-muted dark:text-white/75"
          style={{ fontFamily: getFontFamily('regular', distance) }}
          numberOfLines={1}
        >
          {distance}
        </Text>
      </View>
    </View>
  );
}
