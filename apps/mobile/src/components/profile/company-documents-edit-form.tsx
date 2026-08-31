import { Button } from '@/components/ui/button';
import { ProfileMediaPickerField } from '@/components/profile/profile-media-picker-field';
import { ProfileFormSection } from '@/components/profile/profile-form-section';
import { ProfilePendingBanner } from '@/components/profile/profile-pending-banner';
import { useProfile } from '@/context/profile-context';
import { ApiError, onboardingApi } from '@/lib/api';
import {
  resolveCompanyDocumentUrls,
  type CompanyExistingAssets,
  type PickedFile,
} from '@/lib/profile-company-assets';
import type { CompanyProfileDetail, UpdateCompanyInput } from '@rateq/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

interface CompanyDocumentsEditFormProps {
  company: CompanyProfileDetail;
}

export function CompanyDocumentsEditForm({ company }: CompanyDocumentsEditFormProps) {
  const { t } = useTranslation();
  const { refreshOnboarding } = useProfile();
  const [submitting, setSubmitting] = useState(false);
  const [registration, setRegistration] = useState<PickedFile | null>(null);
  const [establishment, setEstablishment] = useState<PickedFile | null>(null);
  const [tradeLicense, setTradeLicense] = useState<PickedFile | null>(null);
  const [logo, setLogo] = useState<PickedFile | null>(null);
  const [cover, setCover] = useState<PickedFile | null>(null);

  const existing: CompanyExistingAssets = {
    registrationDocUrl: company.registrationDocUrl,
    establishmentCardUrl: company.establishmentCardUrl,
    tradeLicenseUrl: company.tradeLicenseUrl,
    logoUrl: company.logo,
    coverUrl: company.coverUrl,
  };

  const hasChanges = Boolean(registration || establishment || tradeLicense || logo || cover);
  const pendingApproval = company.profileChangeStatus === 'pending';

  const handleSubmit = async () => {
    if (!hasChanges) {
      Alert.alert(t('profile.edit.savedTitle'), t('profile.edit.noChanges'));
      return;
    }

    setSubmitting(true);
    try {
      const urls = await resolveCompanyDocumentUrls({
        registrationDocFile: registration,
        establishmentCardFile: establishment,
        tradeLicenseFile: tradeLicense,
        logoFile: logo,
        coverFile: cover,
        existing,
      });

      const updates: UpdateCompanyInput = {};
      if (registration && urls.registrationDocUrl)
        updates.registrationDocUrl = urls.registrationDocUrl;
      if (establishment && urls.establishmentCardUrl) {
        updates.establishmentCardUrl = urls.establishmentCardUrl;
      }
      if (tradeLicense && urls.tradeLicenseUrl) updates.tradeLicenseUrl = urls.tradeLicenseUrl;
      if (logo) updates.logo = urls.logoUrl;
      if (cover && urls.coverUrl) updates.coverUrl = urls.coverUrl;

      await onboardingApi.updateCompany(updates);
      await refreshOnboarding();
      setRegistration(null);
      setEstablishment(null);
      setTradeLicense(null);
      setLogo(null);
      setCover(null);
      Alert.alert(t('profile.edit.savedTitle'), t('profile.edit.documentsSubmitted'));
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
      title={t('profile.edit.documentsTitle')}
      subtitle={t('profile.edit.documentsSubtitle')}
      banner={pendingApproval ? <ProfilePendingBanner /> : null}
    >
      <ProfileMediaPickerField
        label={t('onboarding.registrationFile')}
        file={registration}
        existingUrl={company.registrationDocUrl}
        onPick={setRegistration}
        onClear={() => setRegistration(null)}
        mode="document"
        shape="wide"
      />
      <ProfileMediaPickerField
        label={t('onboarding.establishmentCardFile')}
        file={establishment}
        existingUrl={company.establishmentCardUrl}
        onPick={setEstablishment}
        onClear={() => setEstablishment(null)}
        mode="document"
        shape="wide"
      />
      <ProfileMediaPickerField
        label={t('onboarding.tradeLicenseFile')}
        file={tradeLicense}
        existingUrl={company.tradeLicenseUrl}
        onPick={setTradeLicense}
        onClear={() => setTradeLicense(null)}
        mode="document"
        shape="wide"
      />
      <ProfileMediaPickerField
        label={t('onboarding.logoFile')}
        file={logo}
        existingUrl={company.logo}
        onPick={setLogo}
        onClear={() => setLogo(null)}
        mode="image"
        shape="square"
      />
      <ProfileMediaPickerField
        label={t('onboarding.coverFile')}
        file={cover}
        existingUrl={company.coverUrl}
        onPick={setCover}
        onClear={() => setCover(null)}
        mode="image"
        shape="wide"
      />
      <Button
        title={submitting ? t('onboarding.saving') : t('profile.edit.saveDocuments')}
        onPress={() => void handleSubmit()}
        loading={submitting}
        disabled={!hasChanges}
      />
    </ProfileFormSection>
  );
}
