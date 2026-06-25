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
import { fetchCompanyCatalogClient } from '@/lib/company-catalog-api';
import { ApiError } from '@/lib/api';
import { getFirebaseStorageErrorMessage } from '@/lib/firebase/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from '@/i18n/routing';
import {
  canAccessDashboard,
  getLockedAccountType,
  isCompanyPendingApproval,
  isCompanyRevisionRequested,
} from '@/lib/profile-routing';
import { canEditCompanyProfile, getStoredProfile, type AccountType } from '@/lib/profile-storage';
import { sanitizeDisplayName } from '@/lib/validation/auth-fields';
import {
  hasValidationErrors,
  MAX_PROFILE_FILE_BYTES,
  sanitizeCompanyName,
  sanitizeCrNumber,
  validateCompanyProfileFields,
  validateReviewerProfileFields,
} from '@/lib/validation/profile-fields';
import { cn } from '@/lib/utils';
import { isRemoteImage, isRemotePdf } from '@/lib/profile-company-assets';
import { getSuggestedDisplayName } from '@/lib/user-display-name';
import { PhoneVerificationField } from '@/components/profile/phone-verification-field';
import { extractQatarPhoneDigits, formatQatarPhoneForSubmit } from '@/lib/qatar-phone';
import { CompanyProfileMultiStepFields } from '@/components/profile/company-profile-multi-step-fields';
import type { CompanyMapLocation } from '@/lib/company-location';
import { Building2, ExternalLink, FileText, Upload, UserRound, X } from 'lucide-react';
import type { CategoryPublic, CompanyCatalogItemPublic } from '@rateq/types';
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
  const companyRevisionRequested = isCompanyRevisionRequested(onboarding);
  const showProfileForm =
    !profileLoading && !companyPending && (!lockedAccountType || companyRevisionRequested);

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
  const [companyNameAr, setCompanyNameAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [activityIds, setActivityIds] = useState<string[]>([]);
  const [yearsEstablished, setYearsEstablished] = useState('');
  const [publicProjectCount, setPublicProjectCount] = useState('');
  const [privateProjectCount, setPrivateProjectCount] = useState('');
  const [catalogServices, setCatalogServices] = useState<CompanyCatalogItemPublic[]>([]);
  const [catalogActivities, setCatalogActivities] = useState<CompanyCatalogItemPublic[]>([]);
  const [companyPhone, setCompanyPhone] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyLocation, setCompanyLocation] = useState<CompanyMapLocation | null>(null);
  const [companyCity, setCompanyCity] = useState('');
  const [companyCountry, setCompanyCountry] = useState('Qatar');
  const [crNumber, setCrNumber] = useState('');
  const [validationDate, setValidationDate] = useState('');
  const [establishmentCardFile, setEstablishmentCardFile] = useState<File | null>(null);
  const [registrationDocFile, setRegistrationDocFile] = useState<File | null>(null);
  const [tradeLicenseFile, setTradeLicenseFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [clearedExisting, setClearedExisting] = useState({
    registrationDoc: false,
    establishmentCard: false,
    tradeLicense: false,
    logo: false,
    cover: false,
    avatar: false,
  });

  const [reviewerPhoneVerified, setReviewerPhoneVerified] = useState(false);
  const [companyPhoneVerified, setCompanyPhoneVerified] = useState(false);
  const [companyStep, setCompanyStep] = useState(1);

  useEffect(() => {
    if (!user) return;
    if (onboarding?.reviewerProfile?.phone) {
      setPhone(extractQatarPhoneDigits(onboarding.reviewerProfile.phone));
      setReviewerPhoneVerified(true);
    }
  }, [user, onboarding]);

  useEffect(() => {
    if (accountType !== 'company') return;
    void fetchCategoriesClient().then(setCategories);
    void Promise.all([
      fetchCompanyCatalogClient('service'),
      fetchCompanyCatalogClient('activity'),
    ]).then(([services, activities]) => {
      setCatalogServices(services);
      setCatalogActivities(activities);
    });
  }, [accountType]);

  useEffect(() => {
    if (!user) return;

    if (onboarding?.accountType) {
      setAccountType(onboarding.accountType);
    }

    if (onboarding?.reviewerProfile) {
      setFullName(onboarding.reviewerProfile.fullName);
      setPhone(extractQatarPhoneDigits(onboarding.reviewerProfile.phone));
      setCity(onboarding.reviewerProfile.city);
      setCountry(onboarding.reviewerProfile.country);
      setBio(onboarding.reviewerProfile.bio);
    }

    if (onboarding?.company) {
      setCompanyName(onboarding.company.name);
      setCompanyNameAr(onboarding.company.nameAr ?? '');
      setDescriptionEn(onboarding.company.descriptionEn ?? onboarding.company.description ?? '');
      setDescriptionAr(onboarding.company.descriptionAr ?? '');
      setServiceIds(onboarding.company.serviceItems?.map((item) => item.id) ?? []);
      setActivityIds(onboarding.company.activityItems?.map((item) => item.id) ?? []);
      setYearsEstablished(
        onboarding.company.yearsEstablished != null
          ? String(onboarding.company.yearsEstablished)
          : '',
      );
      setPublicProjectCount(
        onboarding.company.publicProjectCount != null
          ? String(onboarding.company.publicProjectCount)
          : '',
      );
      setPrivateProjectCount(
        onboarding.company.privateProjectCount != null
          ? String(onboarding.company.privateProjectCount)
          : '',
      );
      setCompanyPhone(extractQatarPhoneDigits(onboarding.company.phone ?? ''));
      setCategoryId(onboarding.company.categoryId ?? '');
      setCompanyAddress(onboarding.company.address ?? '');
      if (onboarding.company.latitude != null && onboarding.company.longitude != null) {
        setCompanyLocation({
          latitude: onboarding.company.latitude,
          longitude: onboarding.company.longitude,
        });
      }
      setCrNumber(onboarding.company.crNumber ?? '');
      setValidationDate(onboarding.company.validationDate?.slice(0, 10) ?? '');
      setCompanyCountry(onboarding.company.country);
      setCompanyCity(onboarding.company.city);
      setClearedExisting({
        registrationDoc: false,
        establishmentCard: false,
        tradeLicense: false,
        logo: false,
        cover: false,
        avatar: false,
      });
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
      setPhone(extractQatarPhoneDigits(profile.reviewer.phone));
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
      establishmentCardUrl:
        onboarding?.company?.establishmentCardUrl ??
        existingProfile?.company?.establishmentCardUrl ??
        null,
      tradeLicenseUrl:
        onboarding?.company?.tradeLicenseUrl ?? existingProfile?.company?.tradeLicenseUrl ?? null,
      logoUrl: onboarding?.company?.logo ?? existingProfile?.company?.logoUrl ?? null,
      coverUrl: onboarding?.company?.coverUrl ?? existingProfile?.company?.coverUrl ?? null,
    }),
    [onboarding, existingProfile],
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
        phoneVerified: reviewerPhoneVerified,
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
        phoneVerification: { required: t('errors.phoneNotVerified') },
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
        companyLocation,
        companyPhone,
        categoryId,
        crNumber,
        validationDate,
        city: companyCity,
        country: companyCountry,
        registrationDocFile,
        establishmentCardFile,
        tradeLicenseFile,
        logoFile,
        coverFile,
        hasExistingRegistrationDoc: Boolean(companyExistingAssets.registrationDocUrl),
        hasExistingEstablishmentCard: Boolean(companyExistingAssets.establishmentCardUrl),
        hasExistingTradeLicense: Boolean(companyExistingAssets.tradeLicenseUrl),
        hasExistingLogo: Boolean(companyExistingAssets.logoUrl),
        hasExistingCover: Boolean(companyExistingAssets.coverUrl),
        companyPhoneVerified,
      },
      {
        required: t('errors.required'),
        fileTooLarge: t('errors.fileTooLarge'),
        companyName: {
          required: t('errors.required'),
          invalid: t('errors.companyNameInvalid'),
          min: t('errors.companyNameMin'),
          max: t('errors.companyNameMax'),
        },
        crNumber: { invalid: t('errors.crNumberInvalid') },
        phone: { required: t('errors.required'), invalid: t('errors.invalidPhone') },
        phoneVerification: { required: t('errors.phoneNotVerified') },
        locationRequired: t('errors.locationRequired'),
      },
    );

    setErrors(fieldErrors);
    if (hasValidationErrors(fieldErrors)) {
      scrollToFirstError(fieldErrors);
      toast.error(t('errors.fixForm'));
    }
    return !hasValidationErrors(fieldErrors);
  };

  const COMPANY_STEP1_KEYS = new Set([
    'companyName',
    'companyAddress',
    'companyLocation',
    'companyPhone',
    'phoneVerification',
    'categoryId',
  ]);

  const validateCompanyStep1 = () => {
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
        registrationDocFile,
        establishmentCardFile,
        tradeLicenseFile,
        logoFile,
        coverFile,
        hasExistingRegistrationDoc: Boolean(companyExistingAssets.registrationDocUrl),
        hasExistingEstablishmentCard: Boolean(companyExistingAssets.establishmentCardUrl),
        hasExistingTradeLicense: Boolean(companyExistingAssets.tradeLicenseUrl),
        hasExistingLogo: Boolean(companyExistingAssets.logoUrl),
        hasExistingCover: Boolean(companyExistingAssets.coverUrl),
        companyPhoneVerified,
      },
      {
        required: t('errors.required'),
        fileTooLarge: t('errors.fileTooLarge'),
        companyName: {
          required: t('errors.required'),
          invalid: t('errors.companyNameInvalid'),
          min: t('errors.companyNameMin'),
          max: t('errors.companyNameMax'),
        },
        crNumber: { invalid: t('errors.crNumberInvalid') },
        phone: { required: t('errors.required'), invalid: t('errors.invalidPhone') },
        phoneVerification: { required: t('errors.phoneNotVerified') },
        locationRequired: t('errors.locationRequired'),
      },
    );

    const stepErrors = Object.fromEntries(
      Object.entries(fieldErrors).filter(([key]) => COMPANY_STEP1_KEYS.has(key)),
    );

    setErrors(stepErrors);
    if (hasValidationErrors(stepErrors)) {
      scrollToFirstError(stepErrors);
      toast.error(t('errors.fixForm'));
    }
    return !hasValidationErrors(stepErrors);
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
          phone: formatQatarPhoneForSubmit(phone),
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
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error && err.message === t('errors.required')
              ? err.message
              : getFirebaseStorageErrorMessage(err, t('errors.uploadPermissionDenied'));
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

    setSubmitting(true);
    try {
      const { registrationDocUrl, establishmentCardUrl, tradeLicenseUrl, logoUrl, coverUrl } =
        await resolveCompanyDocumentUrls({
          registrationDocFile,
          establishmentCardFile,
          tradeLicenseFile,
          logoFile,
          coverFile,
          existing: companyExistingAssets,
        });

      if (
        !registrationDocUrl ||
        !logoUrl ||
        !coverUrl ||
        !establishmentCardUrl ||
        !tradeLicenseUrl ||
        !companyLocation
      ) {
        throw new Error(t('errors.required'));
      }

      const payload = {
        name: companyName.trim(),
        nameAr: companyNameAr.trim() || undefined,
        descriptionEn: descriptionEn.trim() || undefined,
        descriptionAr: descriptionAr.trim() || undefined,
        serviceIds,
        activityIds,
        yearsEstablished: yearsEstablished ? Number(yearsEstablished) : undefined,
        publicProjectCount: publicProjectCount ? Number(publicProjectCount) : undefined,
        privateProjectCount: privateProjectCount ? Number(privateProjectCount) : undefined,
        address: companyAddress.trim(),
        latitude: companyLocation.latitude,
        longitude: companyLocation.longitude,
        phone: formatQatarPhoneForSubmit(companyPhone),
        categoryId,
        crNumber: crNumber.trim(),
        validationDate,
        registrationDocUrl,
        establishmentCardUrl,
        tradeLicenseUrl,
        logo: logoUrl,
        coverUrl,
        country: companyCountry.trim(),
        city: companyCity.trim(),
      };

      if (onboarding?.company && companyRevisionRequested) {
        await onboardingApi.updateCompany(payload);
      } else {
        await onboardingApi.registerCompany(payload);
        await refreshSession();
      }

      await refreshOnboarding();
      toast.success(companyRevisionRequested ? t('companyResubmitted') : t('companySubmitted'));
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) {
        toast.error(t('sessionExpired'));
        router.push('/login');
        return;
      }
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error && err.message === t('errors.required')
            ? err.message
            : getFirebaseStorageErrorMessage(err, t('errors.uploadPermissionDenied'));
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

        <div className="surface-card p-6 sm:p-8">
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
                    ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300'
                    : 'border-slate-200 bg-white text-ink-muted hover:border-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-brand-700',
                  reviewerRoleDisabled &&
                    'cursor-not-allowed opacity-50 hover:border-slate-200 dark:hover:border-slate-700',
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
                    ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300'
                    : 'border-slate-200 bg-white text-ink-muted hover:border-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-brand-700',
                  companyRoleDisabled &&
                    'cursor-not-allowed opacity-50 hover:border-slate-200 dark:hover:border-slate-700',
                )}
              >
                <Building2 className="h-5 w-5" />
                <p className="font-semibold">{t('companyOption')}</p>
              </button>
            </div>
          )}

          {companyPending ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              {t('companyPendingMessage')}
            </div>
          ) : companyRevisionRequested ? (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="font-medium">{t('companyRevisionTitle')}</p>
              {onboarding?.company?.revisionNotes ? (
                <p className="mt-2 whitespace-pre-wrap">{onboarding.company.revisionNotes}</p>
              ) : null}
            </div>
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
                  <PhoneVerificationField
                    phone={phone}
                    onPhoneChange={setPhone}
                    context="reviewer"
                    verified={reviewerPhoneVerified}
                    onVerifiedChange={setReviewerPhoneVerified}
                    onVerified={() => void refreshSession()}
                    error={errors.phone || errors.phoneVerification}
                    label={t('phone')}
                    fieldKey="phone"
                  />
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
                      className="textarea-field"
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
                <CompanyProfileMultiStepFields
                  step={companyStep}
                  onStepChange={setCompanyStep}
                  onValidateStep1={validateCompanyStep1}
                  errors={errors}
                  companyName={companyName}
                  setCompanyName={setCompanyName}
                  companyNameAr={companyNameAr}
                  setCompanyNameAr={setCompanyNameAr}
                  descriptionEn={descriptionEn}
                  setDescriptionEn={setDescriptionEn}
                  descriptionAr={descriptionAr}
                  setDescriptionAr={setDescriptionAr}
                  serviceIds={serviceIds}
                  setServiceIds={setServiceIds}
                  activityIds={activityIds}
                  setActivityIds={setActivityIds}
                  yearsEstablished={yearsEstablished}
                  setYearsEstablished={setYearsEstablished}
                  publicProjectCount={publicProjectCount}
                  setPublicProjectCount={setPublicProjectCount}
                  privateProjectCount={privateProjectCount}
                  setPrivateProjectCount={setPrivateProjectCount}
                  catalogServices={catalogServices}
                  catalogActivities={catalogActivities}
                  companyAddress={companyAddress}
                  setCompanyAddress={setCompanyAddress}
                  companyCity={companyCity}
                  setCompanyCity={setCompanyCity}
                  companyCountry={companyCountry}
                  setCompanyCountry={setCompanyCountry}
                  companyLocation={companyLocation}
                  setCompanyLocation={setCompanyLocation}
                  companyPhone={companyPhone}
                  setCompanyPhone={setCompanyPhone}
                  companyPhoneVerified={companyPhoneVerified}
                  setCompanyPhoneVerified={setCompanyPhoneVerified}
                  categoryId={categoryId}
                  setCategoryId={setCategoryId}
                  categories={categories}
                  crNumber={crNumber}
                  setCrNumber={setCrNumber}
                  validationDate={validationDate}
                  setValidationDate={setValidationDate}
                  registrationDocFile={registrationDocFile}
                  setRegistrationDocFile={setRegistrationDocFile}
                  establishmentCardFile={establishmentCardFile}
                  setEstablishmentCardFile={setEstablishmentCardFile}
                  tradeLicenseFile={tradeLicenseFile}
                  setTradeLicenseFile={setTradeLicenseFile}
                  logoFile={logoFile}
                  setLogoFile={setLogoFile}
                  coverFile={coverFile}
                  setCoverFile={setCoverFile}
                  companyExistingAssets={companyExistingAssets}
                  setClearedExisting={setClearedExisting}
                  sanitizeCompanyName={sanitizeCompanyName}
                  sanitizeCrNumber={sanitizeCrNumber}
                  FileField={FileField}
                  Field={Field}
                />
              )}

              {(accountType === 'reviewer' || companyStep === 3) && (
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
                      : companyRevisionRequested
                        ? t('resubmitCompanyProfile')
                        : t('submitCompanyProfile')}
                </Button>
              )}
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
      <label className="mb-1.5 block text-sm font-medium text-ink dark:text-white">
        {label}
        {required && <span className="text-red-500"> *</span>}
        {optionalLabel && (
          <span className="ms-1 font-normal text-ink-muted dark:text-slate-300">
            ({optionalLabel})
          </span>
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
    'relative mb-3 overflow-hidden border border-default surface-muted',
    previewVariant === 'avatar' && 'h-24 w-24 rounded-full',
    previewVariant === 'logo' && 'h-24 w-24 rounded-2xl',
    (previewVariant === 'cover' || previewVariant === 'document') && 'h-36 w-full rounded-2xl',
  );

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink dark:text-white">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <p className="mb-2 text-xs text-ink-muted dark:text-slate-300">{t('maxFileSize')}</p>

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
        <div className="relative mb-3 flex items-center gap-3 rounded-2xl border border-default surface-muted px-4 py-3 pe-12">
          <FileText className="h-8 w-8 shrink-0 text-brand-500 dark:text-brand-300" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink dark:text-white">{file.name}</p>
            <p className="text-xs text-ink-muted dark:text-slate-300">{t('pdfSelected')}</p>
          </div>
          <RemovePreviewButton
            onClick={handleRemove}
            label={t('removeFile')}
            className="end-2 top-2"
          />
        </div>
      )}

      {(showExistingPdf || showExistingGenericDoc) && (
        <div className="relative mb-3 flex items-center gap-3 rounded-2xl border border-default surface-muted px-4 py-3 pe-12">
          <FileText className="h-8 w-8 shrink-0 text-brand-500 dark:text-brand-300" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink dark:text-white">{t('existingFile')}</p>
            <a
              href={existingUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-300"
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

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-default px-4 py-3 hover:border-brand-400 hover:bg-brand-50/40 dark:hover:border-brand-600 dark:hover:bg-brand-950/20">
        <div className="flex min-w-0 items-center gap-3">
          <Upload className="h-4 w-4 shrink-0 text-brand-500 dark:text-brand-300" />
          <span className="truncate text-sm text-ink-muted dark:text-slate-300">
            {file?.name ?? t('chooseFile')}
          </span>
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
