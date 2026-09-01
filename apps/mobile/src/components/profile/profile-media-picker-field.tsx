import { Label } from '@/components/ui/label';
import { getFontFamily } from '@/i18n';
import { useAppToast } from '@/hooks/use-app-toast';
import { isProfileFileWithinLimit } from '@/lib/validation/profile-fields';
import type { PickedFile } from '@/lib/profile-company-assets';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View } from 'react-native';

function isImageUrl(url?: string | null): boolean {
  if (!url) return false;
  return /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url) || url.includes('image%2F');
}

function isImageMime(mimeType?: string): boolean {
  return Boolean(mimeType?.startsWith('image/'));
}

interface ProfileMediaPickerFieldProps {
  label: string;
  required?: boolean;
  file: PickedFile | null;
  existingUrl?: string | null;
  onPick: (file: PickedFile) => void;
  onClear: () => void;
  error?: string;
  mode: 'image' | 'document';
  shape?: 'avatar' | 'square' | 'wide';
}

function ImageSlot({
  uri,
  sizeClass,
  label,
  onRemove,
}: {
  uri: string;
  sizeClass: string;
  label: string;
  onRemove?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View className="gap-1.5">
      <Text
        className="text-xs font-medium text-ink-muted dark:text-white/60"
        style={{ fontFamily: getFontFamily('medium') }}
      >
        {label}
      </Text>
      <View
        className={`relative overflow-hidden border border-slate-200 bg-white dark:border-dm-border dark:bg-dm-elevated ${sizeClass}`}
      >
        <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />
        {onRemove ? (
          <Pressable
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel={t('profile.edit.removeSelection')}
            className="absolute right-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-full bg-black/60"
            hitSlop={8}
          >
            <Ionicons name="close" size={16} color="#ffffff" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function DocumentSlot({
  name,
  label,
  onRemove,
}: {
  name: string;
  label: string;
  onRemove?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View className="gap-1.5">
      <Text
        className="text-xs font-medium text-ink-muted dark:text-white/60"
        style={{ fontFamily: getFontFamily('medium') }}
      >
        {label}
      </Text>
      <View className="relative flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-dm-border dark:bg-dm-elevated">
        <Ionicons name="document-text-outline" size={28} color="#8E2157" />
        <Text
          className="flex-1 text-sm font-medium text-ink dark:text-white"
          style={{ fontFamily: getFontFamily('medium') }}
          numberOfLines={2}
        >
          {name}
        </Text>
        {onRemove ? (
          <Pressable
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel={t('profile.edit.removeSelection')}
            className="h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10"
            hitSlop={8}
          >
            <Ionicons name="close" size={16} color="#64748b" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function ProfileMediaPickerField({
  label,
  required,
  file,
  existingUrl,
  onPick,
  onClear,
  error,
  mode,
  shape = mode === 'image' ? 'square' : 'wide',
}: ProfileMediaPickerFieldProps) {
  const { t } = useTranslation();
  const toast = useAppToast();

  const pick = async () => {
    if (mode === 'image') {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: shape === 'avatar',
        aspect: shape === 'avatar' ? [1, 1] : undefined,
        quality: 0.9,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const picked: PickedFile = {
        uri: asset.uri,
        name: asset.fileName ?? 'image.jpg',
        mimeType: asset.mimeType ?? 'image/jpeg',
        size: asset.fileSize ?? 0,
      };
      if (!isProfileFileWithinLimit(picked.size)) {
        toast.error(t('onboarding.fileTooLarge'));
        return;
      }
      onPick(picked);
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const picked: PickedFile = {
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? 'application/pdf',
      size: asset.size ?? 0,
    };
    if (!isProfileFileWithinLimit(picked.size)) {
      toast.error(t('onboarding.fileTooLarge'));
      return;
    }
    onPick(picked);
  };

  const existingImageUri =
    mode === 'image' || isImageUrl(existingUrl) ? (existingUrl ?? null) : null;
  const newImageUri = file && (mode === 'image' || isImageMime(file.mimeType)) ? file.uri : null;

  const hasExistingImage = Boolean(existingImageUri);
  const hasNewImage = Boolean(newImageUri);
  const hasExistingDocument = Boolean(existingUrl) && !existingImageUri;
  const hasNewDocument = Boolean(file) && !newImageUri;

  const hasAnyPreview = hasExistingImage || hasNewImage || hasExistingDocument || hasNewDocument;
  const hasPendingChange = Boolean(file);

  const isStacked = shape === 'wide';
  const previewLayoutClass = isStacked ? 'gap-3' : 'flex-row flex-wrap gap-4';
  const slotSizeClass =
    shape === 'avatar'
      ? 'h-24 w-24 rounded-full'
      : shape === 'wide'
        ? 'h-32 w-full rounded-2xl'
        : 'h-24 w-24 rounded-2xl';

  const changeLabel =
    mode === 'image'
      ? hasAnyPreview
        ? t('profile.edit.tapToChangePhoto')
        : t('profile.edit.tapToUploadPhoto')
      : hasAnyPreview
        ? t('profile.edit.tapToChangeFile')
        : t('profile.edit.tapToUploadFile');

  const currentLabel =
    mode === 'image' ? t('profile.edit.currentPhoto') : t('profile.edit.currentFile');
  const newLabel = mode === 'image' ? t('profile.edit.newPhoto') : t('profile.edit.newFile');

  return (
    <View className="gap-2">
      <Label required={required}>{label}</Label>

      {hasAnyPreview ? (
        <View className={previewLayoutClass}>
          {hasExistingImage && existingImageUri ? (
            <ImageSlot uri={existingImageUri} sizeClass={slotSizeClass} label={currentLabel} />
          ) : null}

          {hasExistingDocument ? (
            <DocumentSlot name={t('onboarding.existingFileAttached')} label={currentLabel} />
          ) : null}

          {hasNewImage && newImageUri ? (
            <ImageSlot
              uri={newImageUri}
              sizeClass={slotSizeClass}
              label={newLabel}
              onRemove={onClear}
            />
          ) : null}

          {hasNewDocument && file ? (
            <DocumentSlot name={file.name} label={newLabel} onRemove={onClear} />
          ) : null}
        </View>
      ) : null}

      <Pressable
        onPress={() => void pick()}
        accessibilityRole="button"
        accessibilityLabel={changeLabel}
        className={
          hasAnyPreview
            ? 'flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-300 bg-brand-50/40 px-4 py-3 active:bg-brand-50 dark:border-brand-700 dark:bg-dm-elevated'
            : `relative overflow-hidden border border-dashed border-brand-300 bg-brand-50/40 active:bg-brand-50 dark:border-brand-700 dark:bg-dm-elevated ${
                shape === 'avatar'
                  ? 'h-28 w-28 rounded-full'
                  : shape === 'wide'
                    ? 'h-36 w-full rounded-2xl'
                    : 'h-28 w-28 rounded-2xl'
              }`
        }
      >
        {hasAnyPreview ? (
          <>
            <Ionicons
              name={mode === 'image' ? 'camera-outline' : 'cloud-upload-outline'}
              size={18}
              color="#8E2157"
            />
            <Text
              className="text-sm font-medium text-brand-600 dark:text-gold-300"
              style={{ fontFamily: getFontFamily('medium') }}
            >
              {changeLabel}
            </Text>
          </>
        ) : (
          <View className="flex-1 items-center justify-center px-3">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-500/15">
              <Ionicons
                name={mode === 'image' ? 'image-outline' : 'cloud-upload-outline'}
                size={22}
                color="#8E2157"
              />
            </View>
            <Text
              className="mt-2 text-center text-sm font-medium text-brand-600 dark:text-gold-300"
              style={{ fontFamily: getFontFamily('medium') }}
            >
              {changeLabel}
            </Text>
            <Text
              className="mt-1 text-center text-xs text-ink-muted dark:text-white/60"
              style={{ fontFamily: getFontFamily('regular') }}
            >
              {t('profile.edit.saveToApply')}
            </Text>
          </View>
        )}
      </Pressable>

      {hasPendingChange ? (
        <Text
          className="text-xs text-brand-600 dark:text-gold-300"
          style={{ fontFamily: getFontFamily('regular') }}
        >
          {t('profile.edit.pendingUpload')}
        </Text>
      ) : null}

      {error ? (
        <Text className="text-sm text-red-500" style={{ fontFamily: getFontFamily('regular') }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
