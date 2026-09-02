import { Button } from '@/components/ui/button';
import { ProfileMediaPickerField } from '@/components/profile/profile-media-picker-field';
import { ProfileFormSection } from '@/components/profile/profile-form-section';
import { ProfilePendingBanner } from '@/components/profile/profile-pending-banner';
import { useAppToast } from '@/hooks/use-app-toast';
import { useProfile } from '@/context/profile-context';
import { onboardingApi } from '@/lib/api';
import { uploadChangedCompanyAssets, type PickedFile } from '@/lib/profile-company-assets';
import type { CompanyProfileDetail, UpdateCompanyInput } from '@rateq/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CompanyDocumentsEditFormProps {
  company: CompanyProfileDetail;
}

export function CompanyDocumentsEditForm({ company }: CompanyDocumentsEditFormProps) {
  const { t } = useTranslation();
  const { refreshOnboarding } = useProfile();
  const toast = useAppToast();
  const [submitting, setSubmitting] = useState(false);
  const [registration, setRegistration] = useState<PickedFile | null>(null);
  const [establishment, setEstablishment] = useState<PickedFile | null>(null);
  const [tradeLicense, setTradeLicense] = useState<PickedFile | null>(null);
  const [logo, setLogo] = useState<PickedFile | null>(null);
  const [cover, setCover] = useState<PickedFile | null>(null);

  const hasChanges = Boolean(registration || establishment || tradeLicense || logo || cover);
  const pendingApproval = company.profileChangeStatus === 'pending';

  const handleSubmit = async () => {
    if (!hasChanges) {
      toast.info(t('profile.edit.noChanges'), t('profile.edit.savedTitle'));
      return;
    }

    setSubmitting(true);
    try {
      const urls = await uploadChangedCompanyAssets({
        registrationDocFile: registration,
        establishmentCardFile: establishment,
        tradeLicenseFile: tradeLicense,
        logoFile: logo,
        coverFile: cover,
      });

      const updates: UpdateCompanyInput = {};
      if (registration) {
        if (!urls.registrationDocUrl) throw new Error('upload');
        updates.registrationDocUrl = urls.registrationDocUrl;
      }
      if (establishment) {
        if (!urls.establishmentCardUrl) throw new Error('upload');
        updates.establishmentCardUrl = urls.establishmentCardUrl;
      }
      if (tradeLicense) {
        if (!urls.tradeLicenseUrl) throw new Error('upload');
        updates.tradeLicenseUrl = urls.tradeLicenseUrl;
      }
      if (logo) {
        if (!urls.logoUrl) throw new Error('upload');
        updates.logo = urls.logoUrl;
      }
      if (cover) {
        if (!urls.coverUrl) throw new Error('upload');
        updates.coverUrl = urls.coverUrl;
      }

      if (Object.keys(updates).length === 0) {
        throw new Error('upload');
      }

      await onboardingApi.updateCompany(updates);
      await refreshOnboarding();
      setRegistration(null);
      setEstablishment(null);
      setTradeLicense(null);
      setLogo(null);
      setCover(null);
      toast.success(t('profile.edit.documentsSubmitted'), t('profile.edit.savedTitle'));
    } catch (err) {
      const message =
        err instanceof Error && err.message === 'upload'
          ? t('profile.edit.uploadFailed')
          : err instanceof Error && err.message
            ? err.message
            : t('profile.edit.saveError');
      toast.error(message, t('common.error'));
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
