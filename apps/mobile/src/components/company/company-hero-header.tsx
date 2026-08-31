import { getFontFamily } from '@/i18n';
import { getLocalizedCategoryName } from '@/lib/category-label';
import { useAppDirection } from '@/hooks/use-app-direction';
import type { CompanyPublic } from '@rateq/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image, ImageBackground, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CompanyHeroHeaderProps {
  company: CompanyPublic;
  displayName: string;
}

export function CompanyHeroHeader({ company, displayName }: CompanyHeroHeaderProps) {
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const { isRtl } = useAppDirection();
  const insets = useSafeAreaInsets();
  const locale = i18n.language === 'ar' ? 'ar' : 'en';
  const categoryLabel = getLocalizedCategoryName(company, locale);

  return (
    <View className="relative">
      {company.coverUrl ? (
        <ImageBackground
          source={{ uri: company.coverUrl }}
          className="h-44 w-full"
          resizeMode="cover"
        >
          <View className="absolute inset-0 bg-black/25" />
        </ImageBackground>
      ) : (
        <View className="h-44 w-full bg-brand-600" />
      )}

      <Pressable
        onPress={() => router.back()}
        className="absolute left-4 h-10 w-10 items-center justify-center rounded-full bg-white shadow-md"
        style={{ top: insets.top + 8 }}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
      >
        <Ionicons name={isRtl ? 'arrow-forward' : 'arrow-back'} size={20} color="#8E2157" />
      </Pressable>

      <View
        className="absolute right-4 flex-row flex-wrap justify-end gap-2"
        style={{ top: insets.top + 8 }}
      >
        {company.showVerifiedStamp ? (
          <View className="rounded-md bg-gold-300 px-3 py-1.5">
            <Text
              className="text-xs font-semibold text-white"
              style={{ fontFamily: getFontFamily('semibold') }}
            >
              {t('company.verifiedBadge')}
            </Text>
          </View>
        ) : null}
        {categoryLabel ? (
          <View className="rounded-md bg-white/95 px-3 py-1.5">
            <Text
              className="text-xs font-semibold text-brand-500"
              style={{ fontFamily: getFontFamily('semibold') }}
            >
              {categoryLabel}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="-mt-10 items-center pb-2">
        {company.logo ? (
          <Image
            source={{ uri: company.logo }}
            className="h-24 w-24 rounded-2xl border-4 border-white bg-white shadow-md"
            resizeMode="cover"
          />
        ) : (
          <View className="h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-brand-100 shadow-md">
            <Text
              className="text-3xl font-bold text-brand-500"
              style={{ fontFamily: getFontFamily('bold') }}
            >
              {displayName.charAt(0)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
