'use client';

import { CompanyYearsEstablishedField } from '@/components/profile/company-years-established-field';
import {
  ProfileChangesPendingBanner,
  profileUpdateSuccessMessage,
} from '@/components/dashboard/profile-changes-pending-banner';
import { DashboardProfileLoading } from '@/components/dashboard/dashboard-profile-loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/components/providers/profile-provider';
import { fetchCompanyCatalogClient } from '@/lib/company-catalog-api';
import { onboardingApi } from '@/lib/onboarding-api';
import { ApiError } from '@/lib/api';
import { formatRegistrationDateInput } from '@/lib/company-years';
import { CatalogMultiSelect } from '@/components/profile/catalog-multi-select';
import type {
  CompanyCatalogItemPublic,
  CompanyProfileDetail,
  UpdateCompanyInput,
} from '@rateq/types';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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

function CompanyPublicProfileFormFields({ company }: { company: CompanyProfileDetail }) {
  const t = useTranslations('profilePage');
  const { refreshOnboarding } = useProfile();

  const [nameEn, setNameEn] = useState(() => company.name ?? '');
  const [nameAr, setNameAr] = useState(() => company.nameAr ?? '');
  const [descriptionEn, setDescriptionEn] = useState(
    () => company.descriptionEn ?? company.description ?? '',
  );
  const [descriptionAr, setDescriptionAr] = useState(() => company.descriptionAr ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(() => company.websiteUrl ?? '');
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
  const [submitting, setSubmitting] = useState(false);

  const pendingApproval = company.profileChangeStatus === 'pending';
  const pendingRegistrationDate = company.pendingProfileChanges?.firstRegistrationDate?.slice(
    0,
    10,
  );

  useEffect(() => {
    setNameEn(company.name ?? '');
    setNameAr(company.nameAr ?? '');
    setDescriptionEn(company.descriptionEn ?? company.description ?? '');
    setDescriptionAr(company.descriptionAr ?? '');
    setWebsiteUrl(company.websiteUrl ?? '');
    setServiceIds(company.serviceItems?.map((item) => item.id) ?? []);
    setActivityIds(company.activityItems?.map((item) => item.id) ?? []);
    setFirstRegistrationDate(formatRegistrationDateInput(company));
    setPublicProjectCount(
      company.publicProjectCount != null ? String(company.publicProjectCount) : '',
    );
    setPrivateProjectCount(
      company.privateProjectCount != null ? String(company.privateProjectCount) : '',
    );
  }, [company]);

  useEffect(() => {
    void Promise.all([
      fetchCompanyCatalogClient('service'),
      fetchCompanyCatalogClient('activity'),
    ]).then(([serviceItems, activityItems]) => {
      setServices(serviceItems);
      setActivities(activityItems);
    });
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

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
      toast.info(t('noChangesToSubmit'));
      return;
    }

    setSubmitting(true);
    try {
      await onboardingApi.updateCompany(updates);

      await refreshOnboarding();
      toast.success(
        profileUpdateSuccessMessage(
          company.verificationStatus,
          t('publicProfilePendingApproval'),
          t('publicProfileUpdated'),
        ),
      );
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('saveError');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-subtle surface-card p-6 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-primary">{t('publicProfileTitle')}</h2>
        <p className="mt-1 text-sm text-secondary">{t('publicProfileSubtitle')}</p>
        {pendingApproval ? <ProfileChangesPendingBanner /> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('companyNameEn')} hint={t('companyNameEnHint')}>
          <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="h-11" />
        </Field>
        <Field label={t('companyNameAr')} hint={t('companyNameArHint')}>
          <Input
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            className="h-11"
            dir="rtl"
          />
        </Field>
      </div>

      <Field label={t('companyAboutEn')} hint={t('companyAboutHint')}>
        <textarea
          value={descriptionEn}
          onChange={(e) => setDescriptionEn(e.target.value)}
          rows={4}
          maxLength={5000}
          className="textarea-field"
          placeholder={t('companyAboutPlaceholder')}
        />
      </Field>

      <Field label={t('companyAboutAr')} hint={t('companyAboutArHint')}>
        <textarea
          value={descriptionAr}
          onChange={(e) => setDescriptionAr(e.target.value)}
          rows={4}
          maxLength={5000}
          dir="rtl"
          className="textarea-field"
          placeholder={t('companyAboutArPlaceholder')}
        />
      </Field>

      <Field label={t('websiteUrl')} hint={t('websiteUrlHint')}>
        <Input
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://example.com"
          className="h-11"
        />
      </Field>

      <CatalogMultiSelect
        label={t('companyServices')}
        hint={t('companyServicesCatalogHint')}
        items={services}
        selectedIds={serviceIds}
        onChange={setServiceIds}
      />

      <CatalogMultiSelect
        label={t('companyActivities')}
        hint={t('companyActivitiesHint')}
        items={activities}
        selectedIds={activityIds}
        onChange={setActivityIds}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <CompanyYearsEstablishedField
          firstRegistrationDate={firstRegistrationDate}
          onChange={setFirstRegistrationDate}
          pendingRegistrationDate={pendingRegistrationDate}
        />
        <Field label={t('publicProjectCount')} hint={t('publicProjectCountHint')}>
          <Input
            type="number"
            min={0}
            value={publicProjectCount}
            onChange={(e) => setPublicProjectCount(e.target.value)}
            className="h-11"
          />
        </Field>
        <Field label={t('privateProjectCount')} hint={t('privateProjectCountHint')}>
          <Input
            type="number"
            min={0}
            value={privateProjectCount}
            onChange={(e) => setPrivateProjectCount(e.target.value)}
            className="h-11"
          />
        </Field>
      </div>

      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? t('saving') : t('savePublicProfile')}
      </Button>
    </form>
  );
}

export function CompanyPublicProfileForm() {
  const { onboarding, isLoading: profileLoading } = useProfile();
  const company = onboarding?.company;

  if (profileLoading) return <DashboardProfileLoading />;
  if (!company) return null;

  return <CompanyPublicProfileFormFields key={company.updatedAt} company={company} />;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-primary">{label}</p>
      {hint ? <p className="mb-2 text-xs text-secondary">{hint}</p> : null}
      {children}
    </div>
  );
}
