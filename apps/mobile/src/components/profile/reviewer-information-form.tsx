import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QatarPhoneInput } from '@/components/ui/qatar-phone-input';
import { ProfileFormSection } from '@/components/profile/profile-form-section';
import { ProfileMediaPickerField } from '@/components/profile/profile-media-picker-field';
import { useAuth } from '@/context/auth-context';
import { useProfile } from '@/context/profile-context';
import { getFontFamily } from '@/i18n';
import { ApiError, onboardingApi } from '@/lib/api';
import { uploadUserImage } from '@/lib/firebase/storage';
import { extractQatarPhoneDigits } from '@/lib/qatar-phone';
import {
  hasValidationErrors,
  validateReviewerSettingsFields,
} from '@/lib/validation/profile-fields';
import type { ReviewerProfile } from '@rateq/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Text, View } from 'react-native';

interface ReviewerInformationFormProps {
  profile: ReviewerProfile;
}

export function ReviewerInformationForm({ profile }: ReviewerInformationFormProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { refreshOnboarding } = useProfile();

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fullName, setFullName] = useState(profile.fullName);
  const [city, setCity] = useState(profile.city);
  const [country, setCountry] = useState(profile.country);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUri, setAvatarUri] = useState(profile.avatarUrl);
  const [pendingAvatar, setPendingAvatar] = useState<{
    uri: string;
    name: string;
    mimeType: string;
    size: number;
  } | null>(null);

  const handleSubmit = async () => {
    const fieldErrors = validateReviewerSettingsFields(
      {
        fullName,
        city,
        country,
        bio,
        avatarUri,
        hasExistingAvatar: Boolean(profile.avatarUrl),
        newAvatarSize: pendingAvatar?.size,
      },
      {
        name: {
          required: t('auth.validationNameRequired'),
          invalid: t('onboarding.nameInvalid'),
          min: t('onboarding.nameMin'),
          max: t('onboarding.nameMax'),
        },
        location: { required: t('onboarding.fieldRequired') },
        bio: { max: t('onboarding.bioMax') },
        avatar: {
          required: t('onboarding.avatarRequired'),
          fileTooLarge: t('onboarding.fileTooLarge'),
        },
      },
    );

    setErrors(fieldErrors);
    if (hasValidationErrors(fieldErrors)) {
      Alert.alert(t('common.error'), t('onboarding.fixForm'));
      return;
    }

    if (!user || !avatarUri) return;

    setSubmitting(true);
    try {
      let nextAvatarUrl = avatarUri;
      if (pendingAvatar) {
        nextAvatarUrl = await uploadUserImage('avatars', pendingAvatar.uri, pendingAvatar.name);
      }

      await onboardingApi.completeReviewer({
        fullName: fullName.trim(),
        phone: profile.phone,
        city: city.trim(),
        country: country.trim(),
        bio: bio.trim() || undefined,
        avatarUrl: nextAvatarUrl,
      });

      setPendingAvatar(null);
      setAvatarUri(nextAvatarUrl);
      await refreshOnboarding();
      Alert.alert(t('profile.edit.savedTitle'), t('profile.edit.profileUpdated'));
    } catch (err) {
      Alert.alert(
        t('common.error'),
        err instanceof ApiError ? err.message : t('profile.edit.saveError'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProfileFormSection
      title={t('profile.information.reviewerSection')}
      subtitle={t('profile.edit.reviewerSubtitle')}
    >
      <View>
        <Label required>{t('auth.name')}</Label>
        <Input
          value={fullName}
          onChangeText={setFullName}
          placeholder={t('auth.namePlaceholder')}
        />
        {errors.fullName ? (
          <Text className="mt-1 text-sm text-red-500">{errors.fullName}</Text>
        ) : null}
      </View>

      <View>
        <Label>{t('onboarding.phone')}</Label>
        <QatarPhoneInput
          value={extractQatarPhoneDigits(profile.phone)}
          onChange={() => undefined}
          editable={false}
          className="opacity-80"
        />
        <Text
          className="mt-1 text-xs text-ink-muted dark:text-white/60"
          style={{ fontFamily: getFontFamily('regular') }}
        >
          {t('profile.edit.phoneReadOnly')}
        </Text>
      </View>

      <View>
        <Label required>{t('onboarding.city')}</Label>
        <Input value={city} onChangeText={setCity} placeholder={t('onboarding.cityPlaceholder')} />
        {errors.city ? <Text className="mt-1 text-sm text-red-500">{errors.city}</Text> : null}
      </View>

      <View>
        <Label required>{t('onboarding.country')}</Label>
        <Input
          value={country}
          onChangeText={setCountry}
          placeholder={t('onboarding.countryPlaceholder')}
        />
        {errors.country ? (
          <Text className="mt-1 text-sm text-red-500">{errors.country}</Text>
        ) : null}
      </View>

      <View>
        <Label>{t('onboarding.bio')}</Label>
        <Input
          value={bio}
          onChangeText={setBio}
          multiline
          className="min-h-[88px] py-3"
          placeholder={t('onboarding.bioPlaceholder')}
        />
        {errors.bio ? <Text className="mt-1 text-sm text-red-500">{errors.bio}</Text> : null}
      </View>

      <ProfileMediaPickerField
        label={t('onboarding.avatar')}
        required
        mode="image"
        shape="avatar"
        file={pendingAvatar}
        existingUrl={profile.avatarUrl}
        onPick={(file) => {
          setPendingAvatar(file);
          setAvatarUri(file.uri);
        }}
        onClear={() => {
          setPendingAvatar(null);
          setAvatarUri(profile.avatarUrl);
        }}
        error={errors.avatar}
      />

      <Button
        title={submitting ? t('onboarding.saving') : t('profile.edit.saveChanges')}
        variant="gold"
        onPress={() => void handleSubmit()}
        loading={submitting}
      />
    </ProfileFormSection>
  );
}
