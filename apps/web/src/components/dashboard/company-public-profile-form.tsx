'use client';

import { CatalogMultiSelect } from '@/components/profile/catalog-multi-select';
import { DashboardProfileLoading } from '@/components/dashboard/dashboard-profile-loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/components/providers/profile-provider';
import { fetchCompanyCatalogClient } from '@/lib/company-catalog-api';
import { onboardingApi } from '@/lib/onboarding-api';
import { ApiError } from '@/lib/api';
import type { CompanyCatalogItemPublic, CompanyProfileDetail } from '@rateq/types';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
  const [yearsEstablished, setYearsEstablished] = useState(() =>
    company.yearsEstablished != null ? String(company.yearsEstablished) : '',
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

    setSubmitting(true);
    try {
      await onboardingApi.updateCompany({
        name: nameEn.trim() || undefined,
        nameAr: nameAr.trim() || undefined,
        descriptionEn: descriptionEn.trim() || undefined,
        descriptionAr: descriptionAr.trim() || undefined,
        websiteUrl: websiteUrl.trim() || null,
        serviceIds,
        activityIds,
        yearsEstablished: yearsEstablished ? Number(yearsEstablished) : undefined,
        publicProjectCount: publicProjectCount ? Number(publicProjectCount) : undefined,
        privateProjectCount: privateProjectCount ? Number(privateProjectCount) : undefined,
      });

      await refreshOnboarding();
      const needsApproval = company.verificationStatus === 'approved';
      toast.success(needsApproval ? t('publicProfilePendingApproval') : t('publicProfileUpdated'));
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
        {pendingApproval ? (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            {t('profileChangesPending')}
          </p>
        ) : null}
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
        <Field label={t('yearsEstablished')} hint={t('yearsEstablishedHint')}>
          <Input
            type="number"
            min={0}
            max={200}
            value={yearsEstablished}
            onChange={(e) => setYearsEstablished(e.target.value)}
            className="h-11"
          />
        </Field>
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
