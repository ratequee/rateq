import { getFontFamily } from '@/i18n';
import type { CategoryPublic } from '@rateq/types';
import { Image, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

interface HomeCategoryCardProps {
  category: CategoryPublic;
  onPress?: () => void;
}

export function HomeCategoryCard({ category, onPress }: HomeCategoryCardProps) {
  const { i18n, t } = useTranslation();
  const locale = i18n.language === 'ar' ? 'ar' : 'en';
  const count = category.companyCount ?? 0;
  const showBoth = category.nameEn.trim() !== category.nameAr.trim();

  const primaryName = locale === 'ar' ? category.nameAr : category.nameEn;
  const secondaryName = locale === 'ar' ? category.nameEn : category.nameAr;

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 min-h-[148px] w-[31%] rounded-2xl border border-slate-100 bg-white p-3 pb-4 shadow-sm dark:border-dm-border dark:bg-dm-elevated"
      style={{ marginHorizontal: '1%' }}
    >
      {count > 0 ? (
        <View className="absolute left-2 top-2 z-10 min-w-[28px] items-center rounded-full bg-brand-500 px-2 py-0.5">
          <Text
            className="text-[10px] font-semibold text-white"
            style={{ fontFamily: getFontFamily('semibold') }}
          >
            {count > 99 ? '99+' : count}
          </Text>
        </View>
      ) : null}

      <View className="mx-auto mt-2 h-14 w-14 items-center justify-center rounded-xl bg-gold-300">
        {category.iconUrl ? (
          <Image source={{ uri: category.iconUrl }} className="h-9 w-9" resizeMode="contain" />
        ) : (
          <Text className="text-2xl">🏢</Text>
        )}
      </View>

      <View className="mt-3 min-h-[52px] justify-center px-0.5">
        <Text
          className="text-center text-xs font-semibold text-ink dark:text-white"
          style={{ fontFamily: getFontFamily('semibold', primaryName), lineHeight: 18 }}
          numberOfLines={3}
        >
          {primaryName}
        </Text>
        {showBoth ? (
          <Text
            className="mt-1 text-center text-ink-muted dark:text-white/70"
            style={{
              fontFamily: getFontFamily('regular', secondaryName),
              writingDirection: 'rtl',
              fontSize: 10,
              lineHeight: 16,
            }}
            numberOfLines={3}
          >
            {secondaryName}
          </Text>
        ) : null}
      </View>
      <Text
        className="mt-1 text-center text-[10px] text-ink-muted dark:text-white/60"
        style={{ fontFamily: getFontFamily('regular') }}
      >
        {t('home.categoryCount', { count })}
      </Text>
    </Pressable>
  );
}
