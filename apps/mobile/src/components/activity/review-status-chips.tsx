import { getFontFamily } from '@/i18n';
import { cn } from '@/lib/cn';
import { ReviewStatus } from '@rateq/types';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

export type ReviewStatusFilter = ReviewStatus | 'all';

export const REVIEW_STATUS_FILTERS: ReviewStatusFilter[] = [
  'all',
  ReviewStatus.PENDING,
  ReviewStatus.APPROVED,
  ReviewStatus.RESOLUTION_PENDING,
  ReviewStatus.MODIFIED,
  ReviewStatus.PROCEEDED,
  ReviewStatus.WITHDRAWN,
  ReviewStatus.REJECTED,
  ReviewStatus.DELETED,
];

interface ReviewStatusChipsProps {
  value: ReviewStatusFilter;
  onChange: (value: ReviewStatusFilter) => void;
  counts: Partial<Record<ReviewStatusFilter, number>>;
}

function BilingualStatusChip({
  status,
  active,
  count,
  onPress,
}: {
  status: ReviewStatusFilter;
  active: boolean;
  count: number;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const labelEn = t(`myReviews.statusEn.${status}`);
  const labelAr = t(`myReviews.statusAr.${status}`);
  const showCount = status !== 'all';

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'shrink-0 rounded-full border px-4 py-2.5',
        active
          ? 'border-brand-500 bg-brand-500'
          : 'border-slate-200 bg-white dark:border-dm-border dark:bg-dm-elevated',
      )}
    >
      <View>
        <Text
          className={cn('text-sm font-medium', active ? 'text-white' : 'text-ink dark:text-white')}
          style={{ fontFamily: getFontFamily('medium'), lineHeight: 20 }}
        >
          {showCount ? `${labelEn} (${count})` : labelEn}
        </Text>
        <Text
          className={cn('mt-1', active ? 'text-white/85' : 'text-ink-muted dark:text-white/70')}
          style={{
            fontFamily: getFontFamily('regular'),
            writingDirection: 'rtl',
            fontSize: 11,
            lineHeight: 18,
          }}
        >
          {labelAr}
        </Text>
      </View>
    </Pressable>
  );
}

export function ReviewStatusChips({ value, onChange, counts }: ReviewStatusChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
      keyboardShouldPersistTaps="handled"
    >
      {REVIEW_STATUS_FILTERS.map((status) => (
        <BilingualStatusChip
          key={status}
          status={status}
          active={value === status}
          count={counts[status] ?? 0}
          onPress={() => onChange(status)}
        />
      ))}
    </ScrollView>
  );
}
