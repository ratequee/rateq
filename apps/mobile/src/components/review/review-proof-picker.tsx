import { Label } from '@/components/ui/label';
import { getFontFamily } from '@/i18n';
import { useAppToast } from '@/hooks/use-app-toast';
import {
  createReviewProofFile,
  isReviewProofFileWithinLimit,
  MAX_REVIEW_PROOF_FILES,
  type ReviewProofFile,
} from '@/lib/review-proof-upload';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Pressable, Text, View } from 'react-native';

interface ReviewProofPickerProps {
  files: ReviewProofFile[];
  onAdd: (file: ReviewProofFile) => void;
  onRemove: (index: number) => void;
  error?: string;
}

export function ReviewProofPicker({ files, onAdd, onRemove, error }: ReviewProofPickerProps) {
  const { t } = useTranslation();
  const toast = useAppToast();
  const atLimit = files.length >= MAX_REVIEW_PROOF_FILES;

  const pick = async () => {
    if (atLimit) {
      toast.error(t('review.proofMaxFiles', { count: MAX_REVIEW_PROOF_FILES }));
      return;
    }

    Alert.alert(t('review.proofFiles'), undefined, [
      {
        text: t('review.proofPickImage'),
        onPress: () => void pickImage(),
      },
      {
        text: t('review.proofPickDocument'),
        onPress: () => void pickDocument(),
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const validateAndAdd = (file: ReviewProofFile) => {
    if (!isReviewProofFileWithinLimit(file.size)) {
      toast.error(t('review.proofFileTooLarge'));
      return;
    }
    onAdd(file);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    validateAndAdd(
      await createReviewProofFile({
        uri: asset.uri,
        name: asset.fileName ?? 'proof.jpg',
        mimeType: asset.mimeType ?? 'image/jpeg',
        reportedSize: asset.fileSize,
      }),
    );
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    validateAndAdd(
      await createReviewProofFile({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/pdf',
        reportedSize: asset.size,
      }),
    );
  };

  return (
    <View className="gap-2">
      <Label required>{t('review.proofFiles')}</Label>
      <Text
        className="text-xs text-ink-muted dark:text-white/60"
        style={{ fontFamily: getFontFamily('regular') }}
      >
        {t('review.proofFilesHint', { count: MAX_REVIEW_PROOF_FILES })}
      </Text>

      {files.length > 0 ? (
        <View className="gap-2">
          {files.map((file, index) => {
            const isImage = file.mimeType.startsWith('image/');
            return (
              <View
                key={`${file.uri}-${index}`}
                className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-dm-border dark:bg-dm-elevated"
              >
                {isImage ? (
                  <View className="h-28 w-full">
                    <Image
                      source={{ uri: file.uri }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <View className="flex-row items-center gap-3 px-4 py-3">
                    <Ionicons name="document-text-outline" size={24} color="#8E2157" />
                    <Text
                      className="flex-1 text-sm font-medium text-ink dark:text-white"
                      style={{ fontFamily: getFontFamily('medium') }}
                      numberOfLines={2}
                    >
                      {file.name}
                    </Text>
                  </View>
                )}

                <Pressable
                  onPress={() => onRemove(index)}
                  accessibilityRole="button"
                  accessibilityLabel={t('review.proofRemove')}
                  className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-black/60"
                  hitSlop={8}
                >
                  <Ionicons name="close" size={18} color="#ffffff" />
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : null}

      {!atLimit ? (
        <Pressable
          onPress={() => void pick()}
          className="items-center rounded-2xl border border-dashed border-brand-300 bg-brand-50/40 px-4 py-6 active:bg-brand-50 dark:border-brand-700 dark:bg-dm-elevated"
        >
          <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-500/15">
            <Ionicons name="cloud-upload-outline" size={22} color="#8E2157" />
          </View>
          <Text
            className="mt-2 text-sm font-medium text-brand-600 dark:text-gold-300"
            style={{ fontFamily: getFontFamily('medium') }}
          >
            {files.length > 0 ? t('review.proofAddMore') : t('review.proofUpload')}
          </Text>
          {files.length > 0 ? (
            <Text
              className="mt-1 text-xs text-ink-muted dark:text-white/60"
              style={{ fontFamily: getFontFamily('regular') }}
            >
              {t('review.proofCount', { current: files.length, max: MAX_REVIEW_PROOF_FILES })}
            </Text>
          ) : null}
        </Pressable>
      ) : (
        <Text
          className="text-xs text-ink-muted dark:text-white/60"
          style={{ fontFamily: getFontFamily('regular') }}
        >
          {t('review.proofCount', { current: files.length, max: MAX_REVIEW_PROOF_FILES })}
        </Text>
      )}

      {error ? (
        <Text className="text-sm text-red-500" style={{ fontFamily: getFontFamily('regular') }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
