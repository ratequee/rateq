'use client';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { CompanyPublicProfileForm } from '@/components/dashboard/company-public-profile-form';
import { CompanyInviteReviewersPanel } from '@/components/dashboard/company-invite-reviewers-panel';
import { CompanyAddressMapField } from '@/components/profile/company-address-map-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QatarPhoneInput } from '@/components/ui/qatar-phone-input';
import { extractQatarPhoneDigits } from '@/lib/qatar-phone';
import { useProfile } from '@/components/providers/profile-provider';
import { useRequireCompleteProfile } from '@/hooks/use-require-verified-auth';
import { onboardingApi } from '@/lib/onboarding-api';
import { fetchCategoriesClient } from '@/lib/categories-api';
import { getCategoryLabel } from '@/lib/category-label';
import { ApiError } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';
import { isRemoteImage, isRemotePdf } from '@/lib/profile-company-assets';
import {
  hasValidationErrors,
  validateCompanySettingsFields,
} from '@/lib/validation/profile-fields';
import type { CompanyMapLocation } from '@/lib/company-location';
import type { CategoryPublic } from '@rateq/types';
import { ExternalLink, FileText } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function CompanyProfileSettingsPage() {
  const t = useTranslations('profilePage');
  const locale = useLocale();
  const { onboarding, refreshOnboarding } = useProfile();
  useRequireCompleteProfile();

  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [companyName, setCompanyName] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyLocation, setCompanyLocation] = useState<CompanyMapLocation | null>(null);
  const [companyCity, setCompanyCity] = useState('');
  const [companyCountry, setCompanyCountry] = useState('');

  const company = onboarding?.company;

  useEffect(() => {
    void fetchCategoriesClient().then(setCategories);
  }, []);

  useEffect(() => {
    if (!company) return;
    setCompanyName(company.name);
    setCompanyPhone(extractQatarPhoneDigits(company.phone ?? ''));
    setCategoryId(company.categoryId ?? '');
    setCompanyAddress(company.address ?? '');
    if (company.latitude != null && company.longitude != null) {
      setCompanyLocation({ latitude: company.latitude, longitude: company.longitude });
    }
    setCompanyCity(company.city);
    setCompanyCountry(company.country);
  }, [company]);

  const registrationDetails = useMemo(() => {
    if (!company) return [];

    const items: Array<{ label: string; value: string }> = [];

    if (company.crNumber) {
      items.push({ label: t('crNumber'), value: company.crNumber });
    }

    if (company.validationDate) {
      items.push({
        label: t('validationDate'),
        value: new Date(company.validationDate).toLocaleDateString(locale),
      });
    }

    return items;
  }, [company, locale, t]);

  const documents = useMemo(
    () =>
      [
        { label: t('establishmentCardFile'), url: company?.establishmentCardUrl },
        { label: t('tradeLicenseFile'), url: company?.tradeLicenseUrl },
        { label: t('registrationFile'), url: company?.registrationDocUrl },
        { label: t('companyLogo'), url: company?.logo },
        { label: t('companyCover'), url: company?.coverUrl },
      ].filter((entry) => Boolean(entry.url)),
    [company, t],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const fieldErrors = validateCompanySettingsFields(
      {
        companyName,
        companyAddress,
        companyLocation,
        categoryId,
        city: companyCity,
        country: companyCountry,
      },
      {
        required: t('errors.required'),
        companyName: { min: t('errors.companyNameMin'), max: t('errors.companyNameMax') },
        locationRequired: t('errors.locationRequired'),
      },
    );

    setErrors(fieldErrors);
    if (hasValidationErrors(fieldErrors)) {
      toast.error(t('errors.fixForm'));
      return;
    }

    setSubmitting(true);
    try {
      const token = await ensureValidAccessToken();
      if (!token) throw new Error(t('sessionExpired'));

      await onboardingApi.updateCompany({
        name: companyName.trim(),
        address: companyAddress.trim(),
        latitude: companyLocation?.latitude,
        longitude: companyLocation?.longitude,
        categoryId,
        country: companyCountry.trim(),
        city: companyCity.trim(),
      });

      await refreshOnboarding();
      toast.success(t('profileUpdated'));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('saveError');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell role="company">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink">{t('profileSettingsTitle')}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t('profileSettingsSubtitle')}</p>
          {company?.email && (
            <p className="mt-2 text-sm text-ink-muted">
              {t('accountEmailLabel')}:{' '}
              <span className="font-medium text-ink">{company.email}</span>
            </p>
          )}
        </div>

        {(registrationDetails.length > 0 || documents.length > 0) && (
          <section className="mb-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-ink">{t('submittedDocumentsTitle')}</h2>
            <p className="mt-1 text-sm text-ink-muted">{t('submittedDocumentsHint')}</p>

            {registrationDetails.length > 0 ? (
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {registrationDetails.map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <dt className="text-xs font-medium text-ink-muted">{label}</dt>
                    <dd className="mt-1 text-sm font-medium text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {documents.length > 0 ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {documents.map((document) => (
                  <DocumentPreviewCard
                    key={document.label}
                    label={document.label}
                    url={document.url!}
                  />
                ))}
              </div>
            ) : null}
          </section>
        )}

        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
        >
          <Field label={t('companyName')} error={errors.companyName} required>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="h-11"
            />
          </Field>
          <CompanyAddressMapField
            address={companyAddress}
            city={companyCity}
            country={companyCountry}
            location={companyLocation}
            onAddressChange={setCompanyAddress}
            onCityChange={setCompanyCity}
            onCountryChange={setCompanyCountry}
            onLocationChange={setCompanyLocation}
            addressError={errors.companyAddress}
            locationError={errors.companyLocation}
            fieldKey="companyAddress"
          />

          <Field label={t('phone')} error={errors.companyPhone} required>
            <QatarPhoneInput value={companyPhone} readOnly disabled className="bg-slate-50" />
          </Field>

          <Field label={t('category')} error={errors.categoryId} required>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500"
            >
              <option value="">{t('selectCategory')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {getCategoryLabel(category, locale)}
                </option>
              ))}
            </select>
          </Field>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? t('saving') : t('saveChanges')}
          </Button>
        </form>

        <div className="space-y-6">
          <CompanyPublicProfileForm />
          <CompanyInviteReviewersPanel />
        </div>
      </div>
    </DashboardShell>
  );
}

function DocumentPreviewCard({ label, url }: { label: string; url: string }) {
  const t = useTranslations('profilePage');

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-ink">
        {label}
      </div>
      {isRemoteImage(url) ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          <img src={url} alt={label} className="h-36 w-full object-cover" />
        </a>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 p-6 text-sm font-medium text-brand-600 hover:bg-brand-50"
        >
          <FileText className="h-8 w-8 text-brand-500" />
          <span className="flex items-center gap-1">
            {isRemotePdf(url) ? t('viewExistingFile') : t('viewExistingFile')}
            <ExternalLink className="h-3.5 w-3.5" />
          </span>
        </a>
      )}
    </div>
  );
}

function Field({
  label,
  error,
  children,
  required = false,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
