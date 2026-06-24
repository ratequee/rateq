'use client';

import { CatalogMultiSelect } from '@/components/profile/catalog-multi-select';
import { CompanyAddressMapField } from '@/components/profile/company-address-map-field';
import { PhoneVerificationField } from '@/components/profile/phone-verification-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CompanyMapLocation } from '@/lib/company-location';
import type { CategoryPublic, CompanyCatalogItemPublic } from '@rateq/types';
import type { CompanyExistingAssets } from '@/lib/profile-company-assets';
import { cn } from '@/lib/utils';
import { getCategoryLabel } from '@/lib/category-label';
import { useLocale, useTranslations } from 'next-intl';
import type { Dispatch, SetStateAction } from 'react';

interface CompanyProfileMultiStepFieldsProps {
  step: number;
  onStepChange: (step: number) => void;
  onValidateStep1: () => boolean;
  errors: Record<string, string>;
  companyName: string;
  setCompanyName: (value: string) => void;
  companyNameAr: string;
  setCompanyNameAr: (value: string) => void;
  descriptionEn: string;
  setDescriptionEn: (value: string) => void;
  descriptionAr: string;
  setDescriptionAr: (value: string) => void;
  serviceIds: string[];
  setServiceIds: Dispatch<SetStateAction<string[]>>;
  activityIds: string[];
  setActivityIds: Dispatch<SetStateAction<string[]>>;
  yearsEstablished: string;
  setYearsEstablished: (value: string) => void;
  publicProjectCount: string;
  setPublicProjectCount: (value: string) => void;
  privateProjectCount: string;
  setPrivateProjectCount: (value: string) => void;
  catalogServices: CompanyCatalogItemPublic[];
  catalogActivities: CompanyCatalogItemPublic[];
  companyAddress: string;
  setCompanyAddress: (value: string) => void;
  companyCity: string;
  setCompanyCity: (value: string) => void;
  companyCountry: string;
  setCompanyCountry: (value: string) => void;
  companyLocation: CompanyMapLocation | null;
  setCompanyLocation: (value: CompanyMapLocation | null) => void;
  companyPhone: string;
  setCompanyPhone: (value: string) => void;
  companyPhoneVerified: boolean;
  setCompanyPhoneVerified: (value: boolean) => void;
  categoryId: string;
  setCategoryId: (value: string) => void;
  categories: CategoryPublic[];
  crNumber: string;
  setCrNumber: (value: string) => void;
  validationDate: string;
  setValidationDate: (value: string) => void;
  registrationDocFile: File | null;
  setRegistrationDocFile: (file: File | null) => void;
  establishmentCardFile: File | null;
  setEstablishmentCardFile: (file: File | null) => void;
  tradeLicenseFile: File | null;
  setTradeLicenseFile: (file: File | null) => void;
  logoFile: File | null;
  setLogoFile: (file: File | null) => void;
  coverFile: File | null;
  setCoverFile: (file: File | null) => void;
  companyExistingAssets: CompanyExistingAssets;
  setClearedExisting: Dispatch<
    SetStateAction<{
      registrationDoc: boolean;
      establishmentCard: boolean;
      tradeLicense: boolean;
      logo: boolean;
      cover: boolean;
      avatar: boolean;
    }>
  >;
  sanitizeCompanyName: (value: string) => string;
  sanitizeCrNumber: (value: string) => string;
  FileField: React.ComponentType<{
    label: string;
    error?: string;
    file: File | null;
    onChange: (file: File | null) => void;
    existingUrl?: string | null;
    onClearExisting?: () => void;
    accept: string;
    previewVariant: 'document' | 'logo' | 'cover' | 'avatar';
    required?: boolean;
  }>;
  Field: React.ComponentType<{
    label: string;
    error?: string;
    children: React.ReactNode;
    fieldKey?: string;
    required?: boolean;
    optionalLabel?: string;
  }>;
}

export function CompanyProfileMultiStepFields({
  step,
  onStepChange,
  onValidateStep1,
  errors,
  companyName,
  setCompanyName,
  companyNameAr,
  setCompanyNameAr,
  descriptionEn,
  setDescriptionEn,
  descriptionAr,
  setDescriptionAr,
  serviceIds,
  setServiceIds,
  activityIds,
  setActivityIds,
  yearsEstablished,
  setYearsEstablished,
  publicProjectCount,
  setPublicProjectCount,
  privateProjectCount,
  setPrivateProjectCount,
  catalogServices,
  catalogActivities,
  companyAddress,
  setCompanyAddress,
  companyCity,
  setCompanyCity,
  companyCountry,
  setCompanyCountry,
  companyLocation,
  setCompanyLocation,
  companyPhone,
  setCompanyPhone,
  companyPhoneVerified,
  setCompanyPhoneVerified,
  categoryId,
  setCategoryId,
  categories,
  crNumber,
  setCrNumber,
  validationDate,
  setValidationDate,
  registrationDocFile,
  setRegistrationDocFile,
  establishmentCardFile,
  setEstablishmentCardFile,
  tradeLicenseFile,
  setTradeLicenseFile,
  logoFile,
  setLogoFile,
  coverFile,
  setCoverFile,
  companyExistingAssets,
  setClearedExisting,
  sanitizeCompanyName,
  sanitizeCrNumber,
  FileField,
  Field,
}: CompanyProfileMultiStepFieldsProps) {
  const t = useTranslations('profilePage');
  const locale = useLocale();

  const stepLabel =
    step === 1
      ? t('companyStepEnglish')
      : step === 2
        ? t('companyStepArabic')
        : t('companyStepDocuments');

  const handleNext = () => {
    if (step === 1 && !onValidateStep1()) return;
    onStepChange(Math.min(step + 1, 3));
  };

  return (
    <>
      <div className="mb-4 rounded-xl border border-default surface-muted px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-secondary">
          {t('companyStepIndicator', { current: step, total: 3 })}
        </p>
        <p className="mt-1 text-sm font-semibold text-primary">{stepLabel}</p>
        <div className="mt-3 flex gap-2">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className={cn(
                'h-1.5 flex-1 rounded-full',
                index <= step ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700',
              )}
            />
          ))}
        </div>
      </div>

      {step === 1 ? (
        <>
          <Field
            label={t('companyName')}
            error={errors.companyName}
            fieldKey="companyName"
            required
          >
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(sanitizeCompanyName(e.target.value))}
              onBlur={() => setCompanyName(companyName.trim())}
              className="h-11"
            />
          </Field>
          <Field label={t('companyAboutEn')} fieldKey="descriptionEn">
            <textarea
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              rows={3}
              maxLength={5000}
              className="select-field w-full py-2"
              placeholder={t('companyAboutPlaceholder')}
            />
          </Field>
          <CatalogMultiSelect
            label={t('companyServices')}
            hint={t('companyServicesCatalogHint')}
            items={catalogServices}
            selectedIds={serviceIds}
            onChange={setServiceIds}
          />
          <CatalogMultiSelect
            label={t('companyActivities')}
            hint={t('companyActivitiesHint')}
            items={catalogActivities}
            selectedIds={activityIds}
            onChange={setActivityIds}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t('yearsEstablished')} fieldKey="yearsEstablished">
              <Input
                type="number"
                min={0}
                max={200}
                value={yearsEstablished}
                onChange={(e) => setYearsEstablished(e.target.value)}
                className="h-11"
              />
            </Field>
            <Field label={t('publicProjectCount')} fieldKey="publicProjectCount">
              <Input
                type="number"
                min={0}
                value={publicProjectCount}
                onChange={(e) => setPublicProjectCount(e.target.value)}
                className="h-11"
              />
            </Field>
            <Field label={t('privateProjectCount')} fieldKey="privateProjectCount">
              <Input
                type="number"
                min={0}
                value={privateProjectCount}
                onChange={(e) => setPrivateProjectCount(e.target.value)}
                className="h-11"
              />
            </Field>
          </div>
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
          <PhoneVerificationField
            phone={companyPhone}
            onPhoneChange={setCompanyPhone}
            context="company"
            verified={companyPhoneVerified}
            onVerifiedChange={setCompanyPhoneVerified}
            error={errors.companyPhone || errors.companyPhoneVerification}
            label={t('phone')}
            fieldKey="companyPhone"
          />
          <Field label={t('category')} error={errors.categoryId} fieldKey="categoryId" required>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="select-field h-11 w-full"
            >
              <option value="">{t('selectCategory')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {getCategoryLabel(category, locale)}
                </option>
              ))}
            </select>
          </Field>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <Field label={t('companyNameAr')} fieldKey="companyNameAr">
            <Input
              value={companyNameAr}
              onChange={(e) => setCompanyNameAr(e.target.value)}
              className="h-11"
              dir="rtl"
              placeholder={t('companyNameArHint')}
            />
          </Field>
          <Field label={t('companyAboutAr')} fieldKey="descriptionAr">
            <textarea
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
              rows={5}
              maxLength={5000}
              dir="rtl"
              className="select-field w-full py-2"
              placeholder={t('companyAboutArPlaceholder')}
            />
          </Field>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <Field label={t('crNumber')} error={errors.crNumber} fieldKey="crNumber" required>
            <Input
              value={crNumber}
              onChange={(e) => setCrNumber(sanitizeCrNumber(e.target.value))}
              className="h-11"
            />
          </Field>
          <Field
            label={t('validationDate')}
            error={errors.validationDate}
            fieldKey="validationDate"
            required
          >
            <Input
              type="date"
              value={validationDate}
              onChange={(e) => setValidationDate(e.target.value)}
              className="h-11"
            />
          </Field>
          <div data-field="registrationDocFile">
            <FileField
              label={t('registrationFile')}
              error={errors.registrationDocFile}
              file={registrationDocFile}
              onChange={setRegistrationDocFile}
              existingUrl={companyExistingAssets.registrationDocUrl}
              onClearExisting={() => setClearedExisting((s) => ({ ...s, registrationDoc: true }))}
              accept=".pdf,.jpg,.jpeg,.png"
              previewVariant="document"
              required
            />
          </div>
          <div data-field="establishmentCardFile">
            <FileField
              label={t('establishmentCardFile')}
              error={errors.establishmentCardFile}
              file={establishmentCardFile}
              onChange={setEstablishmentCardFile}
              existingUrl={companyExistingAssets.establishmentCardUrl}
              onClearExisting={() => setClearedExisting((s) => ({ ...s, establishmentCard: true }))}
              accept=".pdf,.jpg,.jpeg,.png"
              previewVariant="document"
              required
            />
          </div>
          <div data-field="tradeLicenseFile">
            <FileField
              label={t('tradeLicenseFile')}
              error={errors.tradeLicenseFile}
              file={tradeLicenseFile}
              onChange={setTradeLicenseFile}
              existingUrl={companyExistingAssets.tradeLicenseUrl}
              onClearExisting={() => setClearedExisting((s) => ({ ...s, tradeLicense: true }))}
              accept=".pdf,.jpg,.jpeg,.png"
              previewVariant="document"
              required
            />
          </div>
          <div data-field="logoFile">
            <FileField
              label={t('companyLogo')}
              error={errors.logoFile}
              file={logoFile}
              onChange={setLogoFile}
              existingUrl={companyExistingAssets.logoUrl}
              onClearExisting={() => setClearedExisting((s) => ({ ...s, logo: true }))}
              accept="image/*"
              previewVariant="logo"
              required
            />
          </div>
          <div data-field="coverFile">
            <FileField
              label={t('companyCover')}
              error={errors.coverFile}
              file={coverFile}
              onChange={setCoverFile}
              existingUrl={companyExistingAssets.coverUrl}
              onClearExisting={() => setClearedExisting((s) => ({ ...s, cover: true }))}
              accept="image/*"
              previewVariant="cover"
              required
            />
          </div>
        </>
      ) : null}

      {step < 3 ? (
        <div className="flex gap-3 pt-2">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={() => onStepChange(step - 1)}>
              {t('previousStep')}
            </Button>
          ) : null}
          <Button type="button" className="flex-1" onClick={handleNext}>
            {t('nextStep')}
          </Button>
        </div>
      ) : step > 1 ? (
        <Button type="button" variant="outline" className="w-full" onClick={() => onStepChange(2)}>
          {t('previousStep')}
        </Button>
      ) : null}
    </>
  );
}
