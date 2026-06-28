'use client';

import { CategoryMultiSelect } from '@/components/profile/category-multi-select';
import { CompanyAddressMapField } from '@/components/profile/company-address-map-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QatarPhoneInput } from '@/components/ui/qatar-phone-input';
import { extractQatarPhoneDigits } from '@/lib/qatar-phone';
import { useProfile } from '@/components/providers/profile-provider';
import { onboardingApi } from '@/lib/onboarding-api';
import { fetchCategoriesClient } from '@/lib/categories-api';
import { ApiError } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';
import {
  hasValidationErrors,
  validateCompanySettingsFields,
} from '@/lib/validation/profile-fields';
import type { CompanyMapLocation } from '@/lib/company-location';
import type { CategoryPublic, CompanyProfileDetail } from '@rateq/types';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

function buildCompanyLocation(company: CompanyProfileDetail): CompanyMapLocation | null {
  if (company.latitude != null && company.longitude != null) {
    return { latitude: company.latitude, longitude: company.longitude };
  }
  return null;
}

function CompanySettingsForm({ company }: { company: CompanyProfileDetail }) {
  const t = useTranslations('profilePage');
  const { refreshOnboarding } = useProfile();

  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [companyName, setCompanyName] = useState(() => company.name);
  const [companyPhone] = useState(() => extractQatarPhoneDigits(company.phone ?? ''));
  const [categoryIds, setCategoryIds] = useState<string[]>(() =>
    company.categoryIds?.length
      ? company.categoryIds
      : company.categoryId
        ? [company.categoryId]
        : [],
  );
  const [companyAddress, setCompanyAddress] = useState(() => company.address ?? '');
  const [companyLocation, setCompanyLocation] = useState<CompanyMapLocation | null>(() =>
    buildCompanyLocation(company),
  );
  const [companyCity, setCompanyCity] = useState(() => company.city);
  const [companyCountry, setCompanyCountry] = useState(() => company.country);

  useEffect(() => {
    void fetchCategoriesClient().then(setCategories);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const fieldErrors = validateCompanySettingsFields(
      {
        companyName,
        companyAddress,
        companyLocation,
        categoryIds,
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
        categoryIds,
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
    <form
      onSubmit={handleSubmit}
      className="mb-6 space-y-4 rounded-2xl surface-card border p-6 shadow-sm"
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
        <QatarPhoneInput
          value={companyPhone}
          readOnly
          disabled
          className="bg-slate-50 dark:bg-dm-elevated"
        />
      </Field>
      <CategoryMultiSelect
        label={t('category')}
        hint={t('categoriesMultiHint')}
        categories={categories}
        selectedIds={categoryIds}
        onChange={setCategoryIds}
        error={errors.categoryId}
      />
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? t('saving') : t('saveChanges')}
      </Button>
    </form>
  );
}

export { CompanySettingsForm };

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
      <label className="mb-1.5 block text-sm font-medium text-primary">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
