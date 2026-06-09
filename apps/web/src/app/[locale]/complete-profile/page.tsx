'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useProfile } from '@/components/providers/profile-provider';
import { useRequireVerifiedAuth } from '@/hooks/use-require-verified-auth';
import { waitForFirebaseUser } from '@/lib/firebase/wait-for-user';
import { uploadUserFile } from '@/lib/firebase/storage';
import { ensureValidAccessToken } from '@/lib/auth-session';
import {
  resolveCompanyDocumentUrls,
  type CompanyExistingAssets,
} from '@/lib/profile-company-assets';
import { onboardingApi } from '@/lib/onboarding-api';
import { fetchCategoriesClient } from '@/lib/categories-api';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from '@/i18n/routing';
import {
  canAccessDashboard,
  getLockedAccountType,
  isCompanyPendingApproval,
  isCompanyRejected,
} from '@/lib/profile-routing';
import { canEditCompanyProfile, getStoredProfile, type AccountType } from '@/lib/profile-storage';
import { sanitizeDisplayName } from '@/lib/validation/auth-fields';
import {
  hasValidationErrors,
  MAX_PROFILE_FILE_BYTES,
  validateCompanyProfileFields,
  validateReviewerProfileFields,
} from '@/lib/validation/profile-fields';
import { cn } from '@/lib/utils';
import { isRemoteImage, isRemotePdf } from '@/lib/profile-company-assets';
import { getSuggestedDisplayName } from '@/lib/user-display-name';
import { Building2, ExternalLink, FileText, Upload, UserRound, X } from 'lucide-react';
import type { CategoryPublic } from '@rateq/types';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function CompleteProfilePage() {
  const t = useTranslations('profilePage');
  const ta = useTranslations('authPage');
  const { user, refreshSession } = useAuth();
  const { onboarding, refreshOnboarding, isLoading: profileLoading } = useProfile();
  const router = useRouter();
  useRequireVerifiedAuth();

  const lockedAccountType = getLockedAccountType(onboarding);
  const companyPending = isCompanyPendingApproval(onboarding);
  const companyRejected = isCompanyRejected(onboarding);
  const showProfileForm =
    !profileLoading && !companyPending && (!lockedAccountType || companyRejected);

  useEffect(() => {
    if (!user || profileLoading) return;
    if (!canAccessDashboard(user, onboarding)) return;
    router.replace(lockedAccountType === 'company' ? '/dashboard/company' : '/dashboard/reviewer');
  }, [user, onboarding, profileLoading, lockedAccountType, router]);
  const existingProfile = useMemo(() => (user ? getStoredProfile() : null), [user, onboarding]);
  const [submitting, setSubmitting] = useState(false);

  const [accountType, setAccountType] = useState<AccountType>('reviewer');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Qatar');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyCountry, setCompanyCountry] = useState('Qatar');
  const [crNumber, setCrNumber] = useState('');
  const [validationDate, setValidationDate] = useState('');
  const [registrationFile, setRegistrationFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [clearedExisting, setClearedExisting] = useState({
    registration: false,
    logo: false,
    cover: false,
    avatar: false,
  });

  useEffect(() => {
    if (accountType !== 'company') return;
    void fetchCategoriesClient().then(setCategories);
  }, [accountType]);

  useEffect(() => {
    if (!user) return;

    if (onboarding?.accountType) {
      setAccountType(onboarding.accountType);
    }

    if (onboarding?.reviewerProfile) {
      setFullName(onboarding.reviewerProfile.fullName);
      setPhone(onboarding.reviewerProfile.phone);
      setCity(onboarding.reviewerProfile.city);
      setCountry(onboarding.reviewerProfile.country);
      setBio(onboarding.reviewerProfile.bio);
    }

    if (onboarding?.company) {
      setCompanyName(onboarding.company.name);
      setCompanyPhone(onboarding.company.phone ?? '');
      setCategoryId(onboarding.company.categoryId ?? '');
      setCompanyAddress(onboarding.company.address ?? '');
      setCrNumber(onboarding.company.crNumber ?? '');
      setValidationDate(onboarding.company.validationDate?.slice(0, 10) ?? '');
      setCompanyCountry(onboarding.company.country);
      setCompanyCity(onboarding.company.city);
      setClearedExisting({ registration: false, logo: false, cover: false, avatar: false });
      return;
    }

    const profile = getStoredProfile();
    if (profile?.userId !== user.id) {
      const prefilled = getSuggestedDisplayName(user, onboarding);
      setFullName(prefilled);
      setCompanyName(prefilled);
      return;
    }

    setAccountType(profile.accountType);
    if (profile.reviewer) {
      setFullName(profile.reviewer.fullName);
      setPhone(profile.reviewer.phone);
      setCity(profile.reviewer.city);
      setCountry(profile.reviewer.country);
      setBio(profile.reviewer.bio);
    }
    if (profile.company) {
      setCompanyName(profile.company.name);
      setCompanyAddress(profile.company.address);
      setCrNumber(profile.company.crNumber);
      setValidationDate(profile.company.validationDate);
    }
  }, [user, onboarding]);

  const existingAssets = useMemo(
    () => ({
      avatarUrl:
        onboarding?.reviewerProfile?.avatarUrl ?? existingProfile?.reviewer?.avatarUrl ?? null,
      registrationDocUrl:
        onboarding?.company?.registrationDocUrl ??
        existingProfile?.company?.registrationDocUrl ??
        null,
      logoUrl: onboarding?.company?.logo ?? existingProfile?.company?.logoUrl ?? null,
      coverUrl: onboarding?.company?.coverUrl ?? existingProfile?.company?.coverUrl ?? null,
    }),
    [onboarding, existingProfile],
  );

  const companyExistingAssets = useMemo<CompanyExistingAssets>(
    () => ({
      registrationDocUrl: clearedExisting.registration ? null : existingAssets.registrationDocUrl,
      logoUrl: clearedExisting.logo ? null : existingAssets.logoUrl,
      coverUrl: clearedExisting.cover ? null : existingAssets.coverUrl,
    }),
    [existingAssets, clearedExisting],
  );

  const reviewerAvatarUrl = clearedExisting.avatar ? null : existingAssets.avatarUrl;

  const scrollToFirstError = (fieldErrors: Record<string, string>) => {
    const firstKey = Object.keys(fieldErrors)[0];
    if (!firstKey) return;
    document
      .querySelector(`[data-field="${firstKey}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const validateReviewer = () => {
    const fieldErrors = validateReviewerProfileFields(
      {
        fullName,
        phone,
        city,
        country,
        bio,
        avatar,
        hasExistingAvatar: Boolean(reviewerAvatarUrl),
      },
      {
        name: {
          required: ta('validationNameRequired'),
          invalid: ta('validationNameInvalid'),
          min: ta('validationNameMin'),
          max: ta('validationNameMax'),
        },
        phone: { required: t('errors.required'), invalid: t('errors.invalidPhone') },
        location: { required: t('errors.required') },
        bio: { max: t('errors.bioMax') },
        avatar: { required: t('errors.required'), fileTooLarge: t('errors.fileTooLarge') },
      },
    );

    setErrors(fieldErrors);
    if (hasValidationErrors(fieldErrors)) {
      scrollToFirstError(fieldErrors);
      toast.error(t('errors.fixForm'));
    }
    return !hasValidationErrors(fieldErrors);
  };

  const validateCompany = () => {
    const fieldErrors = validateCompanyProfileFields(
      {
        companyName,
        companyAddress,
        companyPhone,
        categoryId,
        crNumber,
        validationDate,
        city: companyCity,
        country: companyCountry,
        registrationFile,
        logoFile,
        coverFile,
        hasExistingRegistration: Boolean(companyExistingAssets.registrationDocUrl),
        hasExistingLogo: Boolean(companyExistingAssets.logoUrl),
        hasExistingCover: Boolean(companyExistingAssets.coverUrl),
      },
      {
        required: t('errors.required'),
        fileTooLarge: t('errors.fileTooLarge'),
        companyName: { min: t('errors.companyNameMin'), max: t('errors.companyNameMax') },
        crNumber: { invalid: t('errors.crNumberInvalid') },
        phone: { required: t('errors.required'), invalid: t('errors.invalidPhone') },
      },
    );

    setErrors(fieldErrors);
    if (hasValidationErrors(fieldErrors)) {
      scrollToFirstError(fieldErrors);
      toast.error(t('errors.fixForm'));
    }
    return !hasValidationErrors(fieldErrors);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      toast.error(t('loginRequired'));
      router.push('/login');
      return;
    }

    if (companyPending) return;

    if (lockedAccountType && accountType !== lockedAccountType) {
      toast.error(t('accountTypeLocked'));
      return;
    }

    const accessToken = await ensureValidAccessToken();
    if (!accessToken) {
      toast.error(t('sessionExpired'));
      router.push('/login');
      return;
    }

    if (accountType === 'reviewer') {
      if (onboarding?.company) {
        toast.error(t('accountTypeLocked'));
        return;
      }
      if (!validateReviewer()) return;

      setSubmitting(true);
      try {
        let avatarUrl: string | null = reviewerAvatarUrl;
        if (avatar) {
          await waitForFirebaseUser();
          avatarUrl = await uploadUserFile(user.id, 'avatar', avatar);
        }

        if (!avatarUrl) {
          throw new Error(t('errors.required'));
        }
        await onboardingApi.completeReviewer({
          fullName: fullName.trim(),
          phone: phone.trim(),
          city: city.trim(),
          country: country.trim(),
          bio: bio.trim(),
          avatarUrl,
        });
        await refreshOnboarding();
        toast.success(t('reviewerSaved'));
        router.push('/dashboard/reviewer');
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 401) {
          toast.error(t('sessionExpired'));
          router.push('/login');
          return;
        }
        const message = err instanceof ApiError ? err.message : t('saveError');
        toast.error(message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!canEditCompanyProfile(user.id, onboarding)) {
      toast.error(t('companyLocked'));
      return;
    }

    if (!validateCompany()) return;

    if (companyRejected && !onboarding?.company) {
      toast.error(t('errors.profileLoading'));
      return;
    }

    setSubmitting(true);
    try {
      const { registrationDocUrl, logoUrl, coverUrl } = await resolveCompanyDocumentUrls({
        registrationFile,
        logoFile,
        coverFile,
        existing: companyExistingAssets,
      });

      if (!logoUrl || !coverUrl || !registrationDocUrl) {
        throw new Error(t('errors.required'));
      }

      const payload = {
        name: companyName.trim(),
        address: companyAddress.trim(),
        phone: companyPhone.trim(),
        categoryId,
        crNumber: crNumber.trim(),
        validationDate,
        registrationDocUrl,
        logo: logoUrl,
        coverUrl,
        country: companyCountry.trim(),
        city: companyCity.trim(),
      };

      if (companyRejected) {
        await onboardingApi.updateCompany(payload);
      } else {
        await onboardingApi.registerCompany(payload);
        await refreshSession();
      }

      await refreshOnboarding();
      toast.success(companyRejected ? t('companyResubmitted') : t('companySubmitted'));
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) {
        toast.error(t('sessionExpired'));
        router.push('/login');
        return;
      }
      const message = err instanceof ApiError ? err.message : t('saveError');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const reviewerRoleDisabled = lockedAccountType === 'company';
  const companyRoleDisabled = lockedAccountType === 'reviewer';

  return (
    <div className="bg-brand-500 py-10 sm:py-14">
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{t('title')}</h1>
          <p className="mt-2 text-sm text-white">{t('subtitle')}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {!companyPending && (
            <div className="mb-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={reviewerRoleDisabled}
                onClick={() => {
                  if (reviewerRoleDisabled) return;
                  setAccountType('reviewer');
                  setErrors({});
                }}
                className={cn(
                  'rounded-xl border px-4 py-2 text-start transition-colors flex gap-2 items-center justify-center',
                  accountType === 'reviewer'
                    ? 'border-brand-500 bg-brand-50 text-brand-600'
                    : 'border-slate-200 bg-white text-ink-muted hover:border-brand-200',
                  reviewerRoleDisabled && 'cursor-not-allowed opacity-50 hover:border-slate-200',
                )}
              >
                <UserRound className="h-5 w-5" />
                <p className="font-semibold">{t('reviewerOption')}</p>
              </button>
              <button
                type="button"
                disabled={companyRoleDisabled}
                onClick={() => {
                  if (companyRoleDisabled) return;
                  setAccountType('company');
                  setErrors({});
                }}
                className={cn(
                  'rounded-xl border px-4 py-2 text-start transition-colors flex gap-2 items-center justify-center',
                  accountType === 'company'
                    ? 'border-brand-500 bg-brand-50 text-brand-600'
                    : 'border-slate-200 bg-white text-ink-muted hover:border-brand-200',
                  companyRoleDisabled && 'cursor-not-allowed opacity-50 hover:border-slate-200',
                )}
              >
                <Building2 className="h-5 w-5" />
                <p className="font-semibold">{t('companyOption')}</p>
              </button>
            </div>
          )}

          {companyPending ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {t('companyPendingMessage')}
            </div>
          ) : companyRejected ? (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {t('companyRejectedEditMessage')}
            </p>
          ) : null}

          {showProfileForm && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {accountType === 'reviewer' ? (
                <>
                  <Field label={t('fullName')} error={errors.fullName} fieldKey="fullName" required>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(sanitizeDisplayName(e.target.value))}
                      onBlur={() => setFullName((prev) => prev.trim())}
                      className="h-11"
                    />
                  </Field>
                  <Field label={t('phone')} error={errors.phone} fieldKey="phone" required>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11"
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t('city')} error={errors.city} fieldKey="city" required>
                      <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="h-11"
                      />
                    </Field>
                    <Field label={t('country')} error={errors.country} fieldKey="country" required>
                      <Input
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="h-11"
                      />
                    </Field>
                  </div>
                  <Field
                    label={t('bio')}
                    error={errors.bio}
                    fieldKey="bio"
                    optionalLabel={t('bioOptional')}
                  >
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      maxLength={500}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
                    />
                  </Field>
                  <div data-field="avatar">
                    <FileField
                      label={t('profileImage')}
                      error={errors.avatar}
                      file={avatar}
                      onChange={setAvatar}
                      existingUrl={reviewerAvatarUrl}
                      onClearExisting={() => setClearedExisting((s) => ({ ...s, avatar: true }))}
                      accept="image/*"
                      previewVariant="avatar"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <Field
                    label={t('companyName')}
                    error={errors.companyName}
                    fieldKey="companyName"
                    required
                  >
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="h-11"
                    />
                  </Field>
                  <Field
                    label={t('companyAddress')}
                    error={errors.companyAddress}
                    fieldKey="companyAddress"
                    required
                  >
                    <Input
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      className="h-11"
                    />
                  </Field>
                  <Field
                    label={t('phone')}
                    error={errors.companyPhone}
                    fieldKey="companyPhone"
                    required
                  >
                    <Input
                      type="tel"
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      className="h-11"
                    />
                  </Field>
                  <Field
                    label={t('category')}
                    error={errors.categoryId}
                    fieldKey="categoryId"
                    required
                  >
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t('city')} error={errors.city} fieldKey="city" required>
                      <Input
                        value={companyCity}
                        onChange={(e) => setCompanyCity(e.target.value)}
                        className="h-11"
                      />
                    </Field>
                    <Field label={t('country')} error={errors.country} fieldKey="country" required>
                      <Input
                        value={companyCountry}
                        onChange={(e) => setCompanyCountry(e.target.value)}
                        className="h-11"
                      />
                    </Field>
                  </div>
                  <Field label={t('crNumber')} error={errors.crNumber} fieldKey="crNumber" required>
                    <Input
                      value={crNumber}
                      onChange={(e) => setCrNumber(e.target.value)}
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
                  <div data-field="registrationFile">
                    <FileField
                      label={t('registrationFile')}
                      error={errors.registrationFile}
                      file={registrationFile}
                      onChange={setRegistrationFile}
                      existingUrl={companyExistingAssets.registrationDocUrl}
                      onClearExisting={() =>
                        setClearedExisting((s) => ({ ...s, registration: true }))
                      }
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
              )}

              <Button
                type="submit"
                size="lg"
                className="mt-4 w-full bg-gold-400 text-white hover:bg-gold-500"
                disabled={submitting}
              >
                {submitting
                  ? t('saving')
                  : accountType === 'reviewer'
                    ? t('saveReviewerProfile')
                    : companyRejected
                      ? t('resubmitCompanyProfile')
                      : t('submitCompanyProfile')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
  fieldKey,
  required = false,
  optionalLabel,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  fieldKey?: string;
  required?: boolean;
  optionalLabel?: string;
}) {
  return (
    <div data-field={fieldKey}>
      <label className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-red-500"> *</span>}
        {optionalLabel && (
          <span className="ms-1 font-normal text-ink-muted">({optionalLabel})</span>
        )}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
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
  required = false,
}: {
  label: string;
  error?: string;
  file: File | null;
  onChange: (file: File | null) => void;
  existingUrl?: string | null;
  onClearExisting?: () => void;
  accept: string;
  previewVariant?: 'avatar' | 'logo' | 'cover' | 'document';
  required?: boolean;
}) {
  const t = useTranslations('profilePage');
  const inputRef = useRef<HTMLInputElement>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const previewUrl = useFilePreview(file);
  const isPdf = file?.type === 'application/pdf';
  const showNewImagePreview = Boolean(previewUrl);
  const existingIsPdf = Boolean(existingUrl && isRemotePdf(existingUrl));
  const existingIsImage =
    !file &&
    Boolean(existingUrl) &&
    !existingIsPdf &&
    (previewVariant === 'avatar' ||
      previewVariant === 'logo' ||
      previewVariant === 'cover' ||
      isRemoteImage(existingUrl!));
  const showExistingImage = existingIsImage;
  const showExistingPdf = !file && Boolean(existingUrl) && existingIsPdf;
  const showExistingGenericDoc =
    !file && Boolean(existingUrl) && !showExistingImage && !showExistingPdf;

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
    'relative mb-3 overflow-hidden border border-slate-200 bg-slate-50',
    previewVariant === 'avatar' && 'h-24 w-24 rounded-full',
    previewVariant === 'logo' && 'h-24 w-24 rounded-2xl',
    (previewVariant === 'cover' || previewVariant === 'document') && 'h-36 w-full rounded-2xl',
  );

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <p className="mb-2 text-xs text-ink-muted">{t('maxFileSize')}</p>

      {showNewImagePreview && (
        <div className={previewFrameClass}>
          <img
            src={previewUrl!}
            alt={t('imagePreviewAlt')}
            className="h-full w-full object-cover"
          />
          <RemovePreviewButton onClick={handleRemove} label={t('removeFile')} />
        </div>
      )}

      {showExistingImage && (
        <div className={previewFrameClass}>
          <img
            src={existingUrl!}
            alt={t('imagePreviewAlt')}
            className="h-full w-full object-cover"
          />
          <RemovePreviewButton onClick={handleRemove} label={t('removeFile')} />
          <span className="absolute bottom-2 start-2 rounded-md bg-black/55 px-2 py-0.5 text-xs text-white">
            {t('existingFile')}
          </span>
        </div>
      )}

      {file && isPdf && (
        <div className="relative mb-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pe-12">
          <FileText className="h-8 w-8 shrink-0 text-brand-500" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{file.name}</p>
            <p className="text-xs text-ink-muted">{t('pdfSelected')}</p>
          </div>
          <RemovePreviewButton
            onClick={handleRemove}
            label={t('removeFile')}
            className="end-2 top-2"
          />
        </div>
      )}

      {(showExistingPdf || showExistingGenericDoc) && (
        <div className="relative mb-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pe-12">
          <FileText className="h-8 w-8 shrink-0 text-brand-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">{t('existingFile')}</p>
            <a
              href={existingUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
            >
              {t('viewExistingFile')}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <RemovePreviewButton
            onClick={handleRemove}
            label={t('removeFile')}
            className="end-2 top-2"
          />
        </div>
      )}

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-3 hover:border-brand-400 hover:bg-brand-50/40">
        <div className="flex min-w-0 items-center gap-3">
          <Upload className="h-4 w-4 shrink-0 text-brand-500" />
          <span className="truncate text-sm text-ink-muted">{file?.name ?? t('chooseFile')}</span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
        />
      </label>
      {displayError && <p className="mt-1 text-xs text-red-500">{displayError}</p>}
    </div>
  );
}

function RemovePreviewButton({
  onClick,
  label,
  className,
}: {
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'absolute end-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80',
        className,
      )}
    >
      <X className="h-4 w-4" />
    </button>
  );
}
