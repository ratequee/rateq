'use client';

import { CatalogMultiSelect } from '@/components/profile/catalog-multi-select';
import { CategorySubcategoryPicker } from '@/components/profile/category-subcategory-picker';
import { CompanyAddressMapField } from '@/components/profile/company-address-map-field';
import { CompanyYearsEstablishedField } from '@/components/profile/company-years-established-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QatarPhoneInput } from '@/components/ui/qatar-phone-input';
import { Link, useRouter } from '@/i18n/routing';
import { adminApi } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import { fetchCategoriesClient } from '@/lib/categories-api';
import { fetchCompanyCatalogClient } from '@/lib/company-catalog-api';
import type { CompanyMapLocation } from '@/lib/company-location';
import { approximateRegistrationDateFromYears } from '@/lib/company-years';
import { getFirebaseStorageErrorMessage } from '@/lib/firebase/errors';
import {
  isRemoteImage,
  isRemotePdf,
  resolveCompanyDocumentUrls,
  type CompanyExistingAssets,
} from '@/lib/profile-company-assets';
import {
  extractQatarPhoneDigits,
  formatQatarPhoneForSubmit,
  isValidQatarPhone,
} from '@/lib/qatar-phone';
import { cn } from '@/lib/utils';
import {
  filterSubcategoryIdsForCategories,
  hasValidationErrors,
  MAX_PROFILE_FILE_BYTES,
  sanitizeCompanyName,
  sanitizeCrNumber,
} from '@/lib/validation/profile-fields';
import type {
  AdminCreateCompanyInput,
  CategoryPublic,
  CompanyCatalogItemPublic,
  UpdateCompanyInput,
} from '@rateq/types';
import { Building2, ExternalLink, FileText, Loader2, Upload, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export interface AdminCompanyFormInitialValues {
  name?: string;
  nameAr?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  description?: string | null;
  phone?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  country?: string | null;
  categoryIds?: string[];
  categoryId?: string | null;
  subcategoryIds?: string[];
  serviceItems?: Array<{ id: string }>;
  activityItems?: Array<{ id: string }>;
  crNumber?: string | null;
  validationDate?: string | null;
  firstRegistrationDate?: string | null;
  yearsEstablished?: number | null;
  publicProjectCount?: number | null;
  privateProjectCount?: number | null;
  registrationDocUrl?: string | null;
  establishmentCardUrl?: string | null;
  tradeLicenseUrl?: string | null;
  logo?: string | null;
  coverUrl?: string | null;
  websiteUrl?: string | null;
  socialLinks?: {
    whatsappNumber?: string | null;
    instagramUrl?: string | null;
    youtubeUrl?: string | null;
    facebookUrl?: string | null;
    linkedinUrl?: string | null;
    twitterUrl?: string | null;
  };
  ownerEmail?: string | null;
}

interface AdminCompanyFormProps {
  mode: 'create' | 'edit';
  companyId?: string;
  initialValues?: AdminCompanyFormInitialValues;
}

export function AdminCompanyForm({ mode, companyId, initialValues }: AdminCompanyFormProps) {
  const t = useTranslations('adminCompanyForm');
  const tp = useTranslations('profilePage');
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [catalogServices, setCatalogServices] = useState<CompanyCatalogItemPublic[]>([]);
  const [catalogActivities, setCatalogActivities] = useState<CompanyCatalogItemPublic[]>([]);

  const [ownerEmail, setOwnerEmail] = useState(initialValues?.ownerEmail ?? '');
  const [companyName, setCompanyName] = useState(initialValues?.name ?? '');
  const [companyNameAr, setCompanyNameAr] = useState(initialValues?.nameAr ?? '');
  const [descriptionEn, setDescriptionEn] = useState(
    initialValues?.descriptionEn ?? initialValues?.description ?? '',
  );
  const [descriptionAr, setDescriptionAr] = useState(initialValues?.descriptionAr ?? '');
  const [serviceIds, setServiceIds] = useState<string[]>(
    () => initialValues?.serviceItems?.map((item) => item.id) ?? [],
  );
  const [activityIds, setActivityIds] = useState<string[]>(
    () => initialValues?.activityItems?.map((item) => item.id) ?? [],
  );
  const [firstRegistrationDate, setFirstRegistrationDate] = useState(() => {
    if (initialValues?.firstRegistrationDate) {
      return initialValues.firstRegistrationDate.slice(0, 10);
    }
    if (initialValues?.yearsEstablished != null) {
      return approximateRegistrationDateFromYears(initialValues.yearsEstablished);
    }
    return '';
  });
  const [publicProjectCount, setPublicProjectCount] = useState(
    initialValues?.publicProjectCount != null ? String(initialValues.publicProjectCount) : '',
  );
  const [privateProjectCount, setPrivateProjectCount] = useState(
    initialValues?.privateProjectCount != null ? String(initialValues.privateProjectCount) : '',
  );
  const [companyPhone, setCompanyPhone] = useState(() =>
    extractQatarPhoneDigits(initialValues?.phone ?? ''),
  );
  const [categoryIds, setCategoryIds] = useState<string[]>(() =>
    initialValues?.categoryIds?.length
      ? initialValues.categoryIds
      : initialValues?.categoryId
        ? [initialValues.categoryId]
        : [],
  );
  const [subcategoryIds, setSubcategoryIds] = useState<string[]>(
    () => initialValues?.subcategoryIds ?? [],
  );
  const [companyAddress, setCompanyAddress] = useState(initialValues?.address ?? '');
  const [companyLocation, setCompanyLocation] = useState<CompanyMapLocation | null>(() => {
    if (initialValues?.latitude != null && initialValues?.longitude != null) {
      return { latitude: initialValues.latitude, longitude: initialValues.longitude };
    }
    return null;
  });
  const [companyCity, setCompanyCity] = useState(initialValues?.city ?? '');
  const [companyCountry, setCompanyCountry] = useState(initialValues?.country ?? 'Qatar');
  const [crNumber, setCrNumber] = useState(initialValues?.crNumber ?? '');
  const [validationDate, setValidationDate] = useState(
    () => initialValues?.validationDate?.slice(0, 10) ?? '',
  );
  const [websiteUrl, setWebsiteUrl] = useState(initialValues?.websiteUrl ?? '');
  const [registrationDocFile, setRegistrationDocFile] = useState<File | null>(null);
  const [establishmentCardFile, setEstablishmentCardFile] = useState<File | null>(null);
  const [tradeLicenseFile, setTradeLicenseFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [clearedExisting, setClearedExisting] = useState({
    registrationDoc: false,
    establishmentCard: false,
    tradeLicense: false,
    logo: false,
    cover: false,
  });

  useEffect(() => {
    void fetchCategoriesClient().then(setCategories);
    void Promise.all([
      fetchCompanyCatalogClient('service'),
      fetchCompanyCatalogClient('activity'),
    ]).then(([services, activities]) => {
      setCatalogServices(services);
      setCatalogActivities(activities);
    });
  }, []);

  const existingAssets = useMemo(
    () => ({
      registrationDocUrl: initialValues?.registrationDocUrl ?? null,
      establishmentCardUrl: initialValues?.establishmentCardUrl ?? null,
      tradeLicenseUrl: initialValues?.tradeLicenseUrl ?? null,
      logoUrl: initialValues?.logo ?? null,
      coverUrl: initialValues?.coverUrl ?? null,
    }),
    [initialValues],
  );

  const companyExistingAssets = useMemo<CompanyExistingAssets>(
    () => ({
      registrationDocUrl: clearedExisting.registrationDoc
        ? null
        : existingAssets.registrationDocUrl,
      establishmentCardUrl: clearedExisting.establishmentCard
        ? null
        : existingAssets.establishmentCardUrl,
      tradeLicenseUrl: clearedExisting.tradeLicense ? null : existingAssets.tradeLicenseUrl,
      logoUrl: clearedExisting.logo ? null : existingAssets.logoUrl,
      coverUrl: clearedExisting.cover ? null : existingAssets.coverUrl,
    }),
    [existingAssets, clearedExisting],
  );

  const scrollToFirstError = (fieldErrors: Record<string, string>) => {
    const firstKey = Object.keys(fieldErrors)[0];
    if (!firstKey) return;
    document
      .querySelector(`[data-field="${firstKey}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const validate = (): boolean => {
    const fieldErrors: Record<string, string> = {};

    if (mode === 'create') {
      const email = ownerEmail.trim();
      if (!email) {
        fieldErrors.ownerEmail = t('errors.required');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        fieldErrors.ownerEmail = t('errors.invalidEmail');
      }
    }

    const name = companyName.trim();
    if (!name) {
      fieldErrors.companyName = t('errors.required');
    } else if (name.length < 2) {
      fieldErrors.companyName = tp('errors.companyNameMin');
    } else if (name.length > 200) {
      fieldErrors.companyName = tp('errors.companyNameMax');
    }

    const phone = companyPhone.trim();
    if (phone && !isValidQatarPhone(phone)) {
      fieldErrors.companyPhone = tp('errors.invalidPhone');
    }

    if (
      crNumber.trim() &&
      (crNumber.trim().length < 3 ||
        !/^[\p{L}\p{N}][\p{L}\p{N}\-/]*[\p{L}\p{N}]?$/u.test(crNumber.trim()))
    ) {
      fieldErrors.crNumber = tp('errors.crNumberInvalid');
    }

    const fileChecks: Array<[File | null, string]> = [
      [registrationDocFile, 'registrationDocFile'],
      [establishmentCardFile, 'establishmentCardFile'],
      [tradeLicenseFile, 'tradeLicenseFile'],
      [logoFile, 'logoFile'],
      [coverFile, 'coverFile'],
    ];
    for (const [file, key] of fileChecks) {
      if (file && file.size > MAX_PROFILE_FILE_BYTES) {
        fieldErrors[key] = tp('errors.fileTooLarge');
      }
    }

    setErrors(fieldErrors);
    if (hasValidationErrors(fieldErrors)) {
      scrollToFirstError(fieldErrors);
      toast.error(t('errors.fixForm'));
      return false;
    }
    return true;
  };

  const buildPayloadBase = async (): Promise<
    Omit<AdminCreateCompanyInput, 'ownerEmail' | 'approveImmediately'>
  > => {
    const { registrationDocUrl, establishmentCardUrl, tradeLicenseUrl, logoUrl, coverUrl } =
      await resolveCompanyDocumentUrls({
        registrationDocFile,
        establishmentCardFile,
        tradeLicenseFile,
        logoFile,
        coverFile,
        existing: companyExistingAssets,
      });

    return {
      name: companyName.trim(),
      nameAr: companyNameAr.trim() || undefined,
      descriptionEn: descriptionEn.trim() || undefined,
      descriptionAr: descriptionAr.trim() || undefined,
      phone: companyPhone.trim() ? formatQatarPhoneForSubmit(companyPhone) : undefined,
      address: companyAddress.trim() || undefined,
      latitude: companyLocation?.latitude,
      longitude: companyLocation?.longitude,
      city: companyCity.trim() || undefined,
      country: companyCountry.trim() || undefined,
      categoryIds: categoryIds.length ? categoryIds : undefined,
      subcategoryIds: subcategoryIds.length ? subcategoryIds : undefined,
      serviceIds: serviceIds.length ? serviceIds : undefined,
      activityIds: activityIds.length ? activityIds : undefined,
      crNumber: crNumber.trim() || undefined,
      validationDate: validationDate || undefined,
      firstRegistrationDate: firstRegistrationDate || undefined,
      publicProjectCount: publicProjectCount ? Number(publicProjectCount) : undefined,
      privateProjectCount: privateProjectCount ? Number(privateProjectCount) : undefined,
      registrationDocUrl: registrationDocUrl ?? undefined,
      establishmentCardUrl: establishmentCardUrl ?? undefined,
      tradeLicenseUrl: tradeLicenseUrl ?? undefined,
      logo: logoUrl ?? undefined,
      coverUrl: coverUrl ?? undefined,
      websiteUrl: websiteUrl.trim() || null,
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const base = await buildPayloadBase();

      if (mode === 'create') {
        await adminApi.createCompany({
          ...base,
          ownerEmail: ownerEmail.trim().toLowerCase(),
        });
        toast.success(t('createSuccess'));
        router.push('/dashboard/admin/directory');
        return;
      }

      if (!companyId) throw new Error(t('errors.missingCompany'));

      const updatePayload: UpdateCompanyInput = { ...base };
      await adminApi.updateCompany(companyId, updatePayload);
      toast.success(t('updateSuccess'));
      router.push('/dashboard/admin/directory');
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : getFirebaseStorageErrorMessage(err, t('errors.uploadFailed'));
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {mode === 'create' ? (
        <section className="surface-card space-y-4 rounded-2xl border p-5 sm:p-6">
          <SectionHeading title={t('sections.owner')} subtitle={t('sections.ownerHint')} />
          <Field label={t('ownerEmail')} error={errors.ownerEmail} fieldKey="ownerEmail" required>
            <Input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              className="h-11"
              autoComplete="email"
              placeholder={t('ownerEmailPlaceholder')}
            />
          </Field>
        </section>
      ) : null}

      <section className="surface-card space-y-4 rounded-2xl border p-5 sm:p-6">
        <SectionHeading title={t('sections.basic')} />
        <Field label={tp('companyName')} error={errors.companyName} fieldKey="companyName" required>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(sanitizeCompanyName(e.target.value))}
            onBlur={() => setCompanyName((prev) => prev.trim())}
            className="h-11"
          />
        </Field>
        <Field label={tp('companyNameAr')} fieldKey="companyNameAr">
          <Input
            value={companyNameAr}
            onChange={(e) => setCompanyNameAr(e.target.value)}
            className="h-11"
            dir="rtl"
            placeholder={tp('companyNameArHint')}
          />
        </Field>
        <Field label={tp('companyAboutEn')} fieldKey="descriptionEn">
          <textarea
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            rows={3}
            maxLength={5000}
            className="select-field w-full py-2"
            placeholder={tp('companyAboutPlaceholder')}
          />
        </Field>
        <Field label={tp('companyAboutAr')} fieldKey="descriptionAr">
          <textarea
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
            rows={3}
            maxLength={5000}
            dir="rtl"
            className="select-field w-full py-2"
            placeholder={tp('companyAboutArPlaceholder')}
          />
        </Field>
        <Field label={t('websiteUrl')} fieldKey="websiteUrl">
          <Input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="h-11"
            placeholder="https://"
          />
        </Field>
      </section>

      <section className="surface-card space-y-4 rounded-2xl border p-5 sm:p-6">
        <SectionHeading title={t('sections.catalog')} />
        <CatalogMultiSelect
          label={tp('companyServices')}
          hint={tp('companyServicesCatalogHint')}
          items={catalogServices}
          selectedIds={serviceIds}
          onChange={setServiceIds}
        />
        <CatalogMultiSelect
          label={tp('companyActivities')}
          hint={tp('companyActivitiesHint')}
          items={catalogActivities}
          selectedIds={activityIds}
          onChange={setActivityIds}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <CompanyYearsEstablishedField
            firstRegistrationDate={firstRegistrationDate}
            onChange={setFirstRegistrationDate}
          />
          <Field label={tp('publicProjectCount')} fieldKey="publicProjectCount">
            <Input
              type="number"
              min={0}
              value={publicProjectCount}
              onChange={(e) => setPublicProjectCount(e.target.value)}
              className="h-11"
            />
          </Field>
          <Field label={tp('privateProjectCount')} fieldKey="privateProjectCount">
            <Input
              type="number"
              min={0}
              value={privateProjectCount}
              onChange={(e) => setPrivateProjectCount(e.target.value)}
              className="h-11"
            />
          </Field>
        </div>
        <CategorySubcategoryPicker
          label={tp('category')}
          hint={tp('categoriesSubcategoriesHint')}
          categories={categories}
          selectedCategoryIds={categoryIds}
          selectedSubcategoryIds={subcategoryIds}
          onCategoryChange={(ids) => {
            setCategoryIds(ids);
            setSubcategoryIds((current) =>
              filterSubcategoryIdsForCategories(categories, ids, current),
            );
          }}
          onSubcategoryChange={setSubcategoryIds}
        />
      </section>

      <section className="surface-card space-y-4 rounded-2xl border p-5 sm:p-6">
        <SectionHeading title={t('sections.location')} />
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
        <Field label={tp('phone')} error={errors.companyPhone} fieldKey="companyPhone">
          <QatarPhoneInput value={companyPhone} onChange={setCompanyPhone} />
          <p className="mt-1 text-xs text-secondary">{t('phoneNoOtpHint')}</p>
        </Field>
      </section>

      <section className="surface-card space-y-4 rounded-2xl border p-5 sm:p-6">
        <SectionHeading title={t('sections.documents')} />
        <Field label={tp('crNumber')} error={errors.crNumber} fieldKey="crNumber">
          <Input
            value={crNumber}
            onChange={(e) => setCrNumber(sanitizeCrNumber(e.target.value))}
            className="h-11"
          />
        </Field>
        <Field label={tp('validationDate')} fieldKey="validationDate">
          <Input
            type="date"
            value={validationDate}
            onChange={(e) => setValidationDate(e.target.value)}
            className="h-11"
          />
        </Field>
        <div data-field="registrationDocFile">
          <FileField
            label={tp('registrationFile')}
            error={errors.registrationDocFile}
            file={registrationDocFile}
            onChange={setRegistrationDocFile}
            existingUrl={companyExistingAssets.registrationDocUrl}
            onClearExisting={() => setClearedExisting((s) => ({ ...s, registrationDoc: true }))}
            accept=".pdf,.jpg,.jpeg,.png"
            previewVariant="document"
          />
        </div>
        <div data-field="establishmentCardFile">
          <FileField
            label={tp('establishmentCardFile')}
            error={errors.establishmentCardFile}
            file={establishmentCardFile}
            onChange={setEstablishmentCardFile}
            existingUrl={companyExistingAssets.establishmentCardUrl}
            onClearExisting={() => setClearedExisting((s) => ({ ...s, establishmentCard: true }))}
            accept=".pdf,.jpg,.jpeg,.png"
            previewVariant="document"
          />
        </div>
        <div data-field="tradeLicenseFile">
          <FileField
            label={tp('tradeLicenseFile')}
            error={errors.tradeLicenseFile}
            file={tradeLicenseFile}
            onChange={setTradeLicenseFile}
            existingUrl={companyExistingAssets.tradeLicenseUrl}
            onClearExisting={() => setClearedExisting((s) => ({ ...s, tradeLicense: true }))}
            accept=".pdf,.jpg,.jpeg,.png"
            previewVariant="document"
          />
        </div>
        <div data-field="logoFile">
          <FileField
            label={tp('companyLogo')}
            error={errors.logoFile}
            file={logoFile}
            onChange={setLogoFile}
            existingUrl={companyExistingAssets.logoUrl}
            onClearExisting={() => setClearedExisting((s) => ({ ...s, logo: true }))}
            accept="image/*"
            previewVariant="logo"
          />
        </div>
        <div data-field="coverFile">
          <FileField
            label={tp('companyCover')}
            error={errors.coverFile}
            file={coverFile}
            onChange={setCoverFile}
            existingUrl={companyExistingAssets.coverUrl}
            onClearExisting={() => setClearedExisting((s) => ({ ...s, cover: true }))}
            accept="image/*"
            previewVariant="cover"
          />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting} className="min-w-40">
          {submitting ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              {t('saving')}
            </>
          ) : mode === 'create' ? (
            t('submitCreate')
          ) : (
            t('submitUpdate')
          )}
        </Button>
        <Link
          href="/dashboard/admin/companies"
          className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-medium text-primary transition-colors hover:bg-slate-50 dark:border-dm-border dark:hover:bg-dm-elevated"
        >
          {t('cancel')}
        </Link>
      </div>
    </form>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-primary">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-secondary">{subtitle}</p> : null}
    </div>
  );
}

function Field({
  label,
  error,
  children,
  fieldKey,
  required = false,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  fieldKey?: string;
  required?: boolean;
}) {
  return (
    <div data-field={fieldKey}>
      <label className="mb-1.5 block text-sm font-medium text-ink dark:text-white">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

function useFilePreview(file: File | null) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return previewUrl;
}

function FileField({
  label,
  error,
  file,
  onChange,
  existingUrl,
  onClearExisting,
  accept,
  previewVariant = 'document',
}: {
  label: string;
  error?: string;
  file: File | null;
  onChange: (file: File | null) => void;
  existingUrl?: string | null;
  onClearExisting?: () => void;
  accept: string;
  previewVariant?: 'logo' | 'cover' | 'document';
}) {
  const t = useTranslations('profilePage');
  const inputRef = useRef<HTMLInputElement>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const previewUrl = useFilePreview(file);
  const isPdf = file?.type === 'application/pdf';
  const existingIsPdf = Boolean(existingUrl && isRemotePdf(existingUrl));
  const existingIsImage =
    !file &&
    Boolean(existingUrl) &&
    !existingIsPdf &&
    (previewVariant === 'logo' || previewVariant === 'cover' || isRemoteImage(existingUrl!));

  const handleFileChange = (selected: File | null) => {
    if (!selected) {
      onChange(null);
      setSizeError(null);
      return;
    }
    if (selected.size > MAX_PROFILE_FILE_BYTES) {
      setSizeError(t('errors.fileTooLarge'));
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setSizeError(null);
    onChange(selected);
  };

  const handleRemove = () => {
    if (file) {
      onChange(null);
      setSizeError(null);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    onClearExisting?.();
  };

  const displayError = sizeError ?? error;
  const previewFrameClass = cn(
    'relative mb-3 overflow-hidden border border-default surface-muted',
    previewVariant === 'logo' && 'h-24 w-24 rounded-2xl',
    (previewVariant === 'cover' || previewVariant === 'document') && 'h-36 w-full rounded-2xl',
  );

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink dark:text-white">{label}</label>
      {previewUrl || existingIsImage ? (
        <div className={previewFrameClass}>
          <img src={previewUrl ?? existingUrl!} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
      {(file && isPdf) || (!file && existingIsPdf) ? (
        <a
          href={file ? undefined : existingUrl!}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 flex items-center gap-2 rounded-xl border border-default px-3 py-2 text-sm text-brand-600"
          onClick={file ? (e) => e.preventDefault() : undefined}
        >
          <FileText className="h-4 w-4" />
          {file ? file.name : t('viewExistingFile')}
          {!file ? <ExternalLink className="h-3.5 w-3.5" /> : null}
        </a>
      ) : null}
      {!file && existingUrl && !existingIsImage && !existingIsPdf ? (
        <div className="mb-3 flex items-center gap-2 text-sm text-secondary">
          <Building2 className="h-4 w-4" />
          {t('existingFile')}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          <Upload className="me-2 h-4 w-4" />
          {t('chooseFile')}
        </Button>
        {(file || existingUrl) && onClearExisting ? (
          <Button type="button" variant="outline" onClick={handleRemove}>
            <X className="me-2 h-4 w-4" />
            {t('removeFile')}
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
      />
      {displayError ? <p className="mt-1 text-xs text-red-500">{displayError}</p> : null}
    </div>
  );
}
