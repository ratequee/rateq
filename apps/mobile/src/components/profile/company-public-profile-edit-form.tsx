import { Button } from '@/components/ui/button';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfileCatalogChips } from '@/components/profile/profile-catalog-chips';
import { ProfileFormSection } from '@/components/profile/profile-form-section';
import { ProfilePendingBanner } from '@/components/profile/profile-pending-banner';
import { useAppToast } from '@/hooks/use-app-toast';
import { useProfile } from '@/context/profile-context';
import { catalogApi, onboardingApi } from '@/lib/api';
import {
  formatRegistrationDateInput,
  profileUpdateSuccessMessage,
} from '@/lib/profile-update-messages';
import type {
  CompanyCatalogItemPublic,
  CompanyProfileDetail,
  UpdateCompanyInput,
} from '@rateq/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text } from 'react-native';

function buildPublicProfileUpdates(
  company: CompanyProfileDetail,
  form: {
    nameEn: string;
    nameAr: string;
    descriptionEn: string;
    descriptionAr: string;
    websiteUrl: string;
    serviceIds: string[];
    activityIds: string[];
    firstRegistrationDate: string;
    publicProjectCount: string;
    privateProjectCount: string;
  },
): UpdateCompanyInput {
  const updates: UpdateCompanyInput = {};
  const liveRegistrationDate = formatRegistrationDateInput(company);
  const liveServiceIds = company.serviceItems?.map((item) => item.id) ?? [];
  const liveActivityIds = company.activityItems?.map((item) => item.id) ?? [];

  if (form.nameEn.trim() && form.nameEn.trim() !== (company.name ?? '')) {
    updates.name = form.nameEn.trim();
  }
  if (form.nameAr.trim() !== (company.nameAr ?? '')) {
    updates.nameAr = form.nameAr.trim() || undefined;
  }
  const liveDescriptionEn = company.descriptionEn ?? company.description ?? '';
  if (form.descriptionEn.trim() !== liveDescriptionEn) {
    updates.descriptionEn = form.descriptionEn.trim() || undefined;
  }
  if (form.descriptionAr.trim() !== (company.descriptionAr ?? '')) {
    updates.descriptionAr = form.descriptionAr.trim() || undefined;
  }
  if (form.websiteUrl.trim() !== (company.websiteUrl ?? '')) {
    updates.websiteUrl = form.websiteUrl.trim() || null;
  }
  if (JSON.stringify(form.serviceIds) !== JSON.stringify(liveServiceIds)) {
    updates.serviceIds = form.serviceIds;
  }
  if (JSON.stringify(form.activityIds) !== JSON.stringify(liveActivityIds)) {
    updates.activityIds = form.activityIds;
  }
  if (form.firstRegistrationDate && form.firstRegistrationDate !== liveRegistrationDate) {
    updates.firstRegistrationDate = form.firstRegistrationDate;
  }
  const livePublicCount =
    company.publicProjectCount != null ? String(company.publicProjectCount) : '';
  if (form.publicProjectCount !== livePublicCount) {
    updates.publicProjectCount = form.publicProjectCount
      ? Number(form.publicProjectCount)
      : undefined;
  }
  const livePrivateCount =
    company.privateProjectCount != null ? String(company.privateProjectCount) : '';
  if (form.privateProjectCount !== livePrivateCount) {
    updates.privateProjectCount = form.privateProjectCount
      ? Number(form.privateProjectCount)
      : undefined;
  }

  return updates;
}

interface CompanyPublicProfileEditFormProps {
  company: CompanyProfileDetail;
}

export function CompanyPublicProfileEditForm({ company }: CompanyPublicProfileEditFormProps) {
  const { t } = useTranslation();
  const { refreshOnboarding } = useProfile();
  const toast = useAppToast();
  const [submitting, setSubmitting] = useState(false);
  const [nameEn, setNameEn] = useState(company.name ?? '');
  const [nameAr, setNameAr] = useState(company.nameAr ?? '');
  const [descriptionEn, setDescriptionEn] = useState(
    company.descriptionEn ?? company.description ?? '',
  );
  const [descriptionAr, setDescriptionAr] = useState(company.descriptionAr ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(company.websiteUrl ?? '');
  const [serviceIds, setServiceIds] = useState<string[]>(
    () => company.serviceItems?.map((item) => item.id) ?? [],
  );
  const [activityIds, setActivityIds] = useState<string[]>(
    () => company.activityItems?.map((item) => item.id) ?? [],
  );
  const [firstRegistrationDate, setFirstRegistrationDate] = useState(() =>
    formatRegistrationDateInput(company),
  );
  const [publicProjectCount, setPublicProjectCount] = useState(() =>
    company.publicProjectCount != null ? String(company.publicProjectCount) : '',
  );
  const [privateProjectCount, setPrivateProjectCount] = useState(() =>
    company.privateProjectCount != null ? String(company.privateProjectCount) : '',
  );
  const [services, setServices] = useState<CompanyCatalogItemPublic[]>([]);
  const [activities, setActivities] = useState<CompanyCatalogItemPublic[]>([]);

  const pendingApproval = company.profileChangeStatus === 'pending';

  useEffect(() => {
    void Promise.all([catalogApi.list('service'), catalogApi.list('activity')]).then(
      ([serviceItems, activityItems]) => {
        setServices(serviceItems);
        setActivities(activityItems);
      },
    );
  }, []);

  const handleSubmit = async () => {
    const updates = buildPublicProfileUpdates(company, {
      nameEn,
      nameAr,
      descriptionEn,
      descriptionAr,
      websiteUrl,
      serviceIds,
      activityIds,
      firstRegistrationDate,
      publicProjectCount,
      privateProjectCount,
    });

    if (Object.keys(updates).length === 0) {
      toast.info(t('profile.edit.noChanges'), t('profile.edit.savedTitle'));
      return;
    }

    setSubmitting(true);
    try {
      await onboardingApi.updateCompany(updates);
      await refreshOnboarding();
      toast.success(
        profileUpdateSuccessMessage(
          company.verificationStatus,
          t('profile.edit.pendingApproval'),
          t('profile.edit.publicProfileUpdated'),
        ),
        t('profile.edit.savedTitle'),
      );
    } catch (err) {
      toast.apiError(err, t('profile.edit.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProfileFormSection
      title={t('profile.edit.publicProfileTitle')}
      subtitle={t('profile.edit.publicProfileSubtitle')}
      banner={pendingApproval ? <ProfilePendingBanner /> : null}
    >
      <View>
        <Label>{t('onboarding.companyNameEn')}</Label>
        <Input
          value={nameEn}
          onChangeText={setNameEn}
          placeholder={t('onboarding.companyNameEnPlaceholder')}
        />
      </View>
      <View>
        <Label>{t('onboarding.companyNameAr')}</Label>
        <Input
          value={nameAr}
          onChangeText={setNameAr}
          placeholder={t('onboarding.companyNameArPlaceholder')}
        />
      </View>
      <View>
        <Label>{t('onboarding.companyAboutEn')}</Label>
        <Input
          value={descriptionEn}
          onChangeText={setDescriptionEn}
          multiline
          className="min-h-[100px] py-3"
          placeholder={t('onboarding.companyAboutPlaceholder')}
        />
      </View>
      <View>
        <Label>{t('onboarding.companyAboutAr')}</Label>
        <Input
          value={descriptionAr}
          onChangeText={setDescriptionAr}
          multiline
          className="min-h-[100px] py-3"
          placeholder={t('onboarding.companyAboutArPlaceholder')}
        />
      </View>
      <View>
        <Label>{t('profile.edit.websiteUrl')}</Label>
        <Input
          value={websiteUrl}
          onChangeText={setWebsiteUrl}
          placeholder="https://example.com"
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>
      <View className="gap-2">
        <Label>{t('onboarding.companyServices')}</Label>
        <Text className="text-xs text-ink-muted dark:text-white/70">
          {t('onboarding.companyServicesHint')}
        </Text>
        <ProfileCatalogChips items={services} selectedIds={serviceIds} onChange={setServiceIds} />
      </View>
      <View className="gap-2">
        <Label>{t('onboarding.companyActivities')}</Label>
        <Text className="text-xs text-ink-muted dark:text-white/70">
          {t('onboarding.companyActivitiesHint')}
        </Text>
        <ProfileCatalogChips
          items={activities}
          selectedIds={activityIds}
          onChange={setActivityIds}
        />
      </View>
      <DatePickerField
        label={t('onboarding.firstRegistrationDate')}
        value={firstRegistrationDate}
        onChange={setFirstRegistrationDate}
        maximumDate={new Date()}
      />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Label>{t('onboarding.publicProjectCount')}</Label>
          <Input
            value={publicProjectCount}
            onChangeText={setPublicProjectCount}
            keyboardType="number-pad"
          />
        </View>
        <View className="flex-1">
          <Label>{t('onboarding.privateProjectCount')}</Label>
          <Input
            value={privateProjectCount}
            onChangeText={setPrivateProjectCount}
            keyboardType="number-pad"
          />
        </View>
      </View>
      <Button
        title={submitting ? t('onboarding.saving') : t('profile.edit.savePublicProfile')}
        variant="gold"
        onPress={() => void handleSubmit()}
        loading={submitting}
      />
    </ProfileFormSection>
  );
}
