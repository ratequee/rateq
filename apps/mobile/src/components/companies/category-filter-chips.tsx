import { getFontFamily } from '@/i18n';
import type { CategoryPublic } from '@rateq/types';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

interface CategoryFilterChipsProps {
  categories: CategoryPublic[];
  selectedId: string | null;
  onSelect: (categoryId: string | null) => void;
}

function BilingualChipLabel({
  nameEn,
  nameAr,
  active,
}: {
  nameEn: string;
  nameAr: string;
  active: boolean;
}) {
  const showBoth = nameEn.trim() !== nameAr.trim();

  return (
    <View>
      <Text
        className={`text-sm ${active ? 'text-white' : 'text-ink dark:text-white'}`}
        style={{ fontFamily: getFontFamily('medium', nameEn), lineHeight: 20 }}
      >
        {nameEn}
      </Text>
      {showBoth ? (
        <Text
          className={`mt-1 ${active ? 'text-white/85' : 'text-ink-muted dark:text-white/70'}`}
          style={{
            fontFamily: getFontFamily('regular', nameAr),
            writingDirection: 'rtl',
            fontSize: 11,
            lineHeight: 18,
          }}
        >
          {nameAr}
        </Text>
      ) : null}
    </View>
  );
}

export function CategoryFilterChips({
  categories,
  selectedId,
  onSelect,
}: CategoryFilterChipsProps) {
  const { t } = useTranslation();

  const toggle = (id: string | null) => {
    onSelect(selectedId === id ? null : id);
  };

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: 10, paddingVertical: 6 }}
    >
      <Pressable
        onPress={() => toggle(null)}
        className={`shrink-0 rounded-xl border px-3.5 py-2.5 ${
          selectedId === null
            ? 'border-brand-500 bg-brand-500'
            : 'border-slate-200 bg-white dark:border-dm-border dark:bg-dm-elevated'
        }`}
      >
        <Text
          className={`text-sm ${selectedId === null ? 'text-white' : 'text-ink dark:text-white'}`}
          style={{
            fontFamily: getFontFamily('medium', t('companies.allCategories')),
            lineHeight: 20,
          }}
        >
          {t('companies.allCategories')}
        </Text>
        <Text
          className={`mt-1 ${selectedId === null ? 'text-white/85' : 'text-ink-muted dark:text-white/70'}`}
          style={{
            fontFamily: getFontFamily('regular', t('companies.allCategoriesAr')),
            writingDirection: 'rtl',
            fontSize: 11,
            lineHeight: 18,
          }}
        >
          {t('companies.allCategoriesAr')}
        </Text>
      </Pressable>

      {categories.map((category) => {
        const active = selectedId === category.id;
        return (
          <Pressable
            key={category.id}
            onPress={() => toggle(category.id)}
            className={`shrink-0 rounded-xl border px-3.5 py-2.5 ${
              active
                ? 'border-brand-500 bg-brand-500'
                : 'border-slate-200 bg-white dark:border-dm-border dark:bg-dm-elevated'
            }`}
          >
            <BilingualChipLabel nameEn={category.nameEn} nameAr={category.nameAr} active={active} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
