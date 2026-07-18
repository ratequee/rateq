'use client';

import { ProfileChangesPendingBanner } from '@/components/dashboard/profile-changes-pending-banner';
import { useProfile } from '@/components/providers/profile-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api';
import { onboardingApi } from '@/lib/onboarding-api';
import { resolveCompanyDocumentUrls } from '@/lib/profile-company-assets';
import type { CompanyProfileDetail, UpdateCompanyInput } from '@rateq/types';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

interface CompanyDocumentsFormProps {
  company: CompanyProfileDetail;
}

export function CompanyDocumentsForm({ company }: CompanyDocumentsFormProps) {
  const t = useTranslations('profilePage');
  const { refreshOnboarding } = useProfile();
  const [registration, setRegistration] = useState<File | null>(null);
  const [establishment, setEstablishment] = useState<File | null>(null);
  const [tradeLicense, setTradeLicense] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const hasChanges = Boolean(registration || establishment || tradeLicense || logo || cover);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasChanges) {
      toast.info(t('noChangesToSubmit'));
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
        existing: {
          registrationDocUrl: company.registrationDocUrl,
          establishmentCardUrl: company.establishmentCardUrl,
          tradeLicenseUrl: company.tradeLicenseUrl,
          logoUrl: company.logo,
          coverUrl: company.coverUrl,
        },
      });

      const updates: UpdateCompanyInput = {};
      if (registration && urls.registrationDocUrl) {
        updates.registrationDocUrl = urls.registrationDocUrl;
      }
      if (establishment && urls.establishmentCardUrl) {
        updates.establishmentCardUrl = urls.establishmentCardUrl;
      }
      if (tradeLicense && urls.tradeLicenseUrl) {
        updates.tradeLicenseUrl = urls.tradeLicenseUrl;
      }
      if (logo) updates.logo = urls.logoUrl;
      if (cover && urls.coverUrl) updates.coverUrl = urls.coverUrl;

      await onboardingApi.updateCompany(updates);
      await refreshOnboarding();
      setRegistration(null);
      setEstablishment(null);
      setTradeLicense(null);
      setLogo(null);
      setCover(null);
      toast.success(t('documentsUpdateSubmitted'));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 space-y-5 rounded-2xl border border-subtle surface-card p-6 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-primary">{t('editDocumentsTitle')}</h2>
        <p className="mt-1 text-sm text-secondary">{t('editDocumentsHint')}</p>
        {company.profileChangeStatus === 'pending' ? <ProfileChangesPendingBanner /> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FileInput label={t('registrationFile')} accept="image/*,.pdf" onChange={setRegistration} />
        <FileInput
          label={t('establishmentCardFile')}
          accept="image/*,.pdf"
          onChange={setEstablishment}
        />
        <FileInput label={t('tradeLicenseFile')} accept="image/*,.pdf" onChange={setTradeLicense} />
        <FileInput label={t('companyLogo')} accept="image/*" onChange={setLogo} />
        <FileInput label={t('companyCover')} accept="image/*" onChange={setCover} />
      </div>

      <Button type="submit" disabled={submitting || !hasChanges}>
        {submitting ? t('saving') : t('saveDocumentChanges')}
      </Button>
    </form>
  );
}

function FileInput({
  label,
  accept,
  onChange,
}: {
  label: string;
  accept: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-primary">{label}</span>
      <Input
        type="file"
        accept={accept}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}
