import { ReviewerReviewStatusCard } from '@/components/review/reviewer-review-status-card';
import { Button } from '@/components/ui/button';
import { getFontFamily } from '@/i18n';
import type { ReviewPublic } from '@rateq/types';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ReviewStatusModalProps {
  visible: boolean;
  review: ReviewPublic | null;
  bannerMessage: string | null;
  onClose: () => void;
}

export function ReviewStatusModal({
  visible,
  review,
  bannerMessage,
  onClose,
}: ReviewStatusModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  if (!review) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/50" onPress={onClose}>
        <Pressable
          className="rounded-t-3xl bg-white px-5 pt-5 dark:bg-dm-surface"
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          onPress={(event) => event.stopPropagation()}
        >
          <View className="mb-4 items-center">
            <View className="h-1 w-10 rounded-full bg-slate-200 dark:bg-white/20" />
          </View>

          <Text
            className="mb-4 text-center text-lg font-bold text-ink dark:text-white"
            style={{ fontFamily: getFontFamily('bold') }}
          >
            {t('review.existingReviewTitle')}
          </Text>

          <ReviewerReviewStatusCard review={review} bannerMessage={bannerMessage ?? undefined} />

          <Button
            title={t('review.dismiss')}
            variant="outline"
            className="mt-5 rounded-2xl"
            onPress={onClose}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
