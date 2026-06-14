'use client';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { CompanyAddressMapField } from '@/components/profile/company-address-map-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/components/providers/profile-provider';
import { useRequireCompleteProfile } from '@/hooks/use-require-verified-auth';
import { onboardingApi } from '@/lib/onboarding-api';
import { fetchCategoriesClient } from '@/lib/categories-api';
import { ApiError } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';
import { isRemoteImage, isRemotePdf } from '@/lib/profile-company-assets';
import { hasValidationErrors, validateCompanyProfileFields } from '@/lib/validation/profile-fields';
import type { CompanyMapLocation } from '@/lib/company-location';
import type { CategoryPublic } from '@rateq/types';
import { ExternalLink, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function CompanyProfileSettingsPage() {
  const t = useTranslations('profilePage');
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
  const [crNumber, setCrNumber] = useState('');
  const [validationDate, setValidationDate] = useState('');

  const company = onboarding?.company;

  useEffect(() => {
    void fetchCategoriesClient().then(setCategories);
  }, []);

  useEffect(() => {
    if (!company) return;
    setCompanyName(company.name);
    setCompanyPhone(company.phone ?? '');
    setCategoryId(company.categoryId ?? '');
    setCompanyAddress(company.address ?? '');
    if (company.latitude != null && company.longitude != null) {
      setCompanyLocation({ latitude: company.latitude, longitude: company.longitude });
    }
    setCompanyCity(company.city);
    setCompanyCountry(company.country);
    setCrNumber(company.crNumber ?? '');
    setValidationDate(company.validationDate?.slice(0, 10) ?? '');
  }, [company]);

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

    const fieldErrors = validateCompanyProfileFields(
      {
        companyName,
        companyAddress,
        companyLocation,
        companyPhone,
        categoryId,
        crNumber,
        validationDate,
        city: companyCity,
        country: companyCountry,
        establishmentCardFile: null,
        tradeLicenseFile: null,
        logoFile: null,
        coverFile: null,
        hasExistingEstablishmentCard: true,
        hasExistingTradeLicense: true,
        hasExistingLogo: true,
        hasExistingCover: true,
        companyPhoneVerified: true,
      },
      {
        required: t('errors.required'),
        fileTooLarge: t('errors.fileTooLarge'),
        companyName: { min: t('errors.companyNameMin'), max: t('errors.companyNameMax') },
        crNumber: { invalid: t('errors.crNumberInvalid') },
        phone: { required: t('errors.required'), invalid: t('errors.invalidPhone') },
        phoneVerification: { required: t('errors.phoneNotVerified') },
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
        crNumber: crNumber.trim(),
        validationDate,
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
              Email: <span className="font-medium text-ink">{company.email}</span>
            </p>
          )}
        </div>

        {documents.length > 0 && (
          <section className="mb-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-ink">{t('submittedDocumentsTitle')}</h2>
            <p className="mt-1 text-sm text-ink-muted">{t('submittedDocumentsHint')}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {documents.map((document) => (
                <DocumentPreviewCard
                  key={document.label}
                  label={document.label}
                  url={document.url!}
                />
              ))}
            </div>
          </section>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
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
            <Input
              type="tel"
              value={companyPhone}
              placeholder={t('phonePlaceholder')}
              className="h-11 bg-slate-50"
              disabled
              readOnly
            />
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
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('crNumber')} error={errors.crNumber} required>
            <Input
              value={crNumber}
              onChange={(e) => setCrNumber(e.target.value)}
              className="h-11"
            />
          </Field>
          <Field label={t('validationDate')} error={errors.validationDate} required>
            <Input
              type="date"
              value={validationDate}
              onChange={(e) => setValidationDate(e.target.value)}
              className="h-11"
            />
          </Field>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? t('saving') : t('saveChanges')}
          </Button>
        </form>
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
