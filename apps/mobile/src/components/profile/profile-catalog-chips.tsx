import { getFontFamily } from '@/i18n';
import { Pressable, ScrollView, Text, View } from 'react-native';

interface CatalogChipItem {
  id: string;
  nameEn: string;
  nameAr: string;
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
        className={`text-sm leading-snug ${active ? 'text-white' : 'text-ink dark:text-white'}`}
        style={{ fontFamily: getFontFamily('medium', nameEn) }}
      >
        {nameEn}
      </Text>
      {showBoth ? (
        <Text
          className={`mt-0.5 text-xs leading-snug ${active ? 'text-white/85' : 'text-ink-muted dark:text-white/70'}`}
          style={{ fontFamily: getFontFamily('regular', nameAr), writingDirection: 'rtl' }}
        >
          {nameAr}
        </Text>
      ) : null}
    </View>
  );
}

interface ProfileCatalogChipsProps {
  items: CatalogChipItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function ProfileCatalogChips({ items, selectedIds, onChange }: ProfileCatalogChipsProps) {
  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id],
    );
  };

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
    >
      {items.map((item) => {
        const active = selectedIds.includes(item.id);
        return (
          <Pressable
            key={item.id}
            onPress={() => toggle(item.id)}
            className={`shrink-0 rounded-xl border px-3 py-2 ${
              active
                ? 'border-brand-500 bg-brand-500'
                : 'border-slate-200 bg-white dark:border-dm-border dark:bg-dm-elevated'
            }`}
          >
            <BilingualChipLabel nameEn={item.nameEn} nameAr={item.nameAr} active={active} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
