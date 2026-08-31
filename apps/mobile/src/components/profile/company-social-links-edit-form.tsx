import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfileFormSection } from '@/components/profile/profile-form-section';
import { useProfile } from '@/context/profile-context';
import { ApiError, onboardingApi } from '@/lib/api';
import type { CompanyProfileDetail, CompanySocialLinks } from '@rateq/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

interface CompanySocialLinksEditFormProps {
  company: CompanyProfileDetail;
}

export function CompanySocialLinksEditForm({ company }: CompanySocialLinksEditFormProps) {
  const { t } = useTranslation();
  const { refreshOnboarding } = useProfile();
  const [submitting, setSubmitting] = useState(false);
  const [socialLinks, setSocialLinks] = useState<CompanySocialLinks>(
    () =>
      company.socialLinks ?? {
        whatsappNumber: null,
        instagramUrl: null,
        youtubeUrl: null,
        facebookUrl: null,
        linkedinUrl: null,
        twitterUrl: null,
      },
  );

  const updateLink = (key: keyof CompanySocialLinks, value: string) => {
    setSocialLinks((current) => ({ ...current, [key]: value.trim() || null }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onboardingApi.updateCompany({
        whatsappNumber: socialLinks.whatsappNumber,
        instagramUrl: socialLinks.instagramUrl,
        youtubeUrl: socialLinks.youtubeUrl,
        facebookUrl: socialLinks.facebookUrl,
        linkedinUrl: socialLinks.linkedinUrl,
        twitterUrl: socialLinks.twitterUrl,
      });
      await refreshOnboarding();
      Alert.alert(t('profile.edit.savedTitle'), t('profile.edit.socialLinksUpdated'));
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
      title={t('profile.edit.socialLinksTitle')}
      subtitle={t('profile.edit.socialLinksSubtitle')}
    >
      <View>
        <Label>{t('profile.edit.whatsapp')}</Label>
        <Input
          value={socialLinks.whatsappNumber ?? ''}
          onChangeText={(value) => updateLink('whatsappNumber', value)}
          keyboardType="phone-pad"
        />
      </View>
      <View>
        <Label>{t('profile.edit.instagram')}</Label>
        <Input
          value={socialLinks.instagramUrl ?? ''}
          onChangeText={(value) => updateLink('instagramUrl', value)}
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>
      <View>
        <Label>{t('profile.edit.youtube')}</Label>
        <Input
          value={socialLinks.youtubeUrl ?? ''}
          onChangeText={(value) => updateLink('youtubeUrl', value)}
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>
      <View>
        <Label>{t('profile.edit.facebook')}</Label>
        <Input
          value={socialLinks.facebookUrl ?? ''}
          onChangeText={(value) => updateLink('facebookUrl', value)}
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>
      <View>
        <Label>{t('profile.edit.linkedin')}</Label>
        <Input
          value={socialLinks.linkedinUrl ?? ''}
          onChangeText={(value) => updateLink('linkedinUrl', value)}
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>
      <View>
        <Label>{t('profile.edit.twitter')}</Label>
        <Input
          value={socialLinks.twitterUrl ?? ''}
          onChangeText={(value) => updateLink('twitterUrl', value)}
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>
      <Button
        title={submitting ? t('onboarding.saving') : t('profile.edit.saveSocialLinks')}
        onPress={() => void handleSubmit()}
        loading={submitting}
      />
    </ProfileFormSection>
  );
}
