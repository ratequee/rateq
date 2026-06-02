'use client';

import { AuthLayout } from '@/components/auth/auth-layout';
import { Logo } from '@/components/brand/logo';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useRouter } from '@/i18n/routing';
import { getDashboardPath } from '@/lib/profile-routing';
import {
  canEditCompanyProfile,
  getStoredProfile,
  saveStoredProfile,
  type AccountType,
} from '@/lib/profile-storage';
import { cn } from '@/lib/utils';
import { Building2, FileText, Upload, UserRound, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function isFileWithinLimit(file: File | null): boolean {
  return !file || file.size <= MAX_FILE_SIZE_BYTES;
}

export default function CompleteProfilePage() {
  const t = useTranslations('profilePage');
  const { user } = useAuth();
  const router = useRouter();
  const existingProfile = useMemo(() => (user ? getStoredProfile() : null), [user]);

  const [accountType, setAccountType] = useState<AccountType>('reviewer');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Qatar');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [crNumber, setCrNumber] = useState('');
  const [validationDate, setValidationDate] = useState('');
  const [registrationFile, setRegistrationFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;

    const profile = getStoredProfile();
    if (profile?.userId !== user.id) return;

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
    } else {
      const pendingName = localStorage.getItem('rateq_pending_name');
      const prefilled =
        pendingName ||
        user.email.split('@')[0]?.replace(/[._-]/g, ' ') ||
        '';
      setCompanyName(prefilled);
      if (!fullName) setFullName(prefilled);
    }
  }, [user]);

  const validateReviewer = () => {
    const nextErrors: Record<string, string> = {};
    if (!fullName.trim()) nextErrors.fullName = t('errors.required');
    if (!phone.trim()) nextErrors.phone = t('errors.required');
    if (!city.trim()) nextErrors.city = t('errors.required');
    if (!country.trim()) nextErrors.country = t('errors.required');
    if (!avatar && !existingProfile?.reviewer?.avatarFileName) {
      nextErrors.avatar = t('errors.required');
    } else if (avatar && !isFileWithinLimit(avatar)) {
      nextErrors.avatar = t('errors.fileTooLarge');
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateCompany = () => {
    const nextErrors: Record<string, string> = {};
    if (!companyName.trim()) nextErrors.companyName = t('errors.required');
    if (!companyAddress.trim()) nextErrors.companyAddress = t('errors.required');
    if (!crNumber.trim()) nextErrors.crNumber = t('errors.required');
    if (!validationDate) nextErrors.validationDate = t('errors.required');
    if (!registrationFile && !existingProfile?.company?.registrationFileName) {
      nextErrors.registrationFile = t('errors.required');
    } else if (registrationFile && !isFileWithinLimit(registrationFile)) {
      nextErrors.registrationFile = t('errors.fileTooLarge');
    }
    if (!logoFile && !existingProfile?.company?.logoFileName) {
      nextErrors.logoFile = t('errors.required');
    } else if (logoFile && !isFileWithinLimit(logoFile)) {
      nextErrors.logoFile = t('errors.fileTooLarge');
    }
    if (!coverFile && !existingProfile?.company?.coverFileName) {
      nextErrors.coverFile = t('errors.required');
    } else if (coverFile && !isFileWithinLimit(coverFile)) {
      nextErrors.coverFile = t('errors.fileTooLarge');
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      toast.error(t('loginRequired'));
      router.push('/login');
      return;
    }

    if (accountType === 'reviewer') {
      if (!validateReviewer()) return;

      saveStoredProfile({
        userId: user.id,
        accountType: 'reviewer',
        isComplete: true,
        reviewer: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          city: city.trim(),
          country: country.trim(),
          bio: bio.trim(),
          avatarFileName: avatar?.name ?? existingProfile?.reviewer?.avatarFileName ?? 'avatar.jpg',
        },
      });

      toast.success(t('reviewerSaved'));
      router.push('/dashboard/reviewer');
      return;
    }

    if (!canEditCompanyProfile(user.id)) {
      toast.error(t('companyLocked'));
      router.push('/dashboard/company');
      return;
    }

    if (!validateCompany()) return;

    saveStoredProfile({
      userId: user.id,
      accountType: 'company',
      isComplete: true,
      companyVerificationStatus: 'pending',
      company: {
        name: companyName.trim(),
        address: companyAddress.trim(),
        crNumber: crNumber.trim(),
        validationDate,
        registrationFileName:
          registrationFile?.name ?? existingProfile?.company?.registrationFileName ?? 'registration.pdf',
        logoFileName: logoFile?.name ?? existingProfile?.company?.logoFileName ?? 'logo.png',
        coverFileName: coverFile?.name ?? existingProfile?.company?.coverFileName ?? 'cover.png',
      },
    });

    toast.success(t('companySubmitted'));
    router.push('/dashboard/company');
  };

  const companyLocked =
    user &&
    existingProfile?.userId === user.id &&
    existingProfile.accountType === 'company' &&
    existingProfile.isComplete &&
    existingProfile.companyVerificationStatus !== 'rejected';

  return (
    <AuthLayout variant="login">
      <div className='max-w-md mx-auto px-4 py-10'>
        <div className="mb-6 flex flex-col items-center">
          <Link href="/" className="mb-4">
            <Logo variant="default" />
          </Link>
          <h2 className="text-2xl font-bold text-ink">{t('title')}</h2>
          <p className="mt-2 text-center text-sm text-ink-muted">{t('subtitle')}</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAccountType('reviewer')}
            className={cn(
              'rounded-xl border px-4 py-2 text-start transition-colors flex gap-2 items-center justify-center',
              accountType === 'reviewer'
                ? 'border-brand-500 bg-brand-50 text-brand-600'
                : 'border-slate-200 bg-white text-ink-muted hover:border-brand-200',
            )}
          >
            <UserRound className="h-5 w-5" />
            <p className="font-semibold">{t('reviewerOption')}</p>
          </button>
          <button
            type="button"
            onClick={() => setAccountType('company')}
            className={cn(
              'rounded-xl border px-4 py-2 text-start transition-colors flex gap-2 items-center justify-center',
              accountType === 'company'
                ? 'border-brand-500 bg-brand-50 text-brand-600'
                : 'border-slate-200 bg-white text-ink-muted hover:border-brand-200',
            )}
          >
            <Building2 className="h-5 w-5" />
            <p className="font-semibold">{t('companyOption')}</p>
          </button>
        </div>

        {companyLocked && accountType === 'company' ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {t('companyPendingMessage')}
            <div className="mt-4">
              <Link href={user ? getDashboardPath(user) : '/dashboard/company'}>
                <Button className="w-full">{t('goToDashboard')}</Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {accountType === 'reviewer' ? (
              <>
                <Field label={t('fullName')} error={errors.fullName}>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11" />
                </Field>
                <Field label={t('phone')} error={errors.phone}>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t('city')} error={errors.city}>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-11" />
                  </Field>
                  <Field label={t('country')} error={errors.country}>
                    <Input value={country} onChange={(e) => setCountry(e.target.value)} className="h-11" />
                  </Field>
                </div>
                <Field label={t('bio')} error={errors.bio}>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </Field>
                <FileField
                  label={t('profileImage')}
                  error={errors.avatar}
                  file={avatar}
                  onChange={setAvatar}
                  accept="image/*"
                  previewVariant="avatar"
                />
              </>
            ) : (
              <>
                <Field label={t('companyName')} error={errors.companyName}>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-11" />
                </Field>
                <Field label={t('companyAddress')} error={errors.companyAddress}>
                  <Input
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="h-11"
                  />
                </Field>
                <Field label={t('crNumber')} error={errors.crNumber}>
                  <Input value={crNumber} onChange={(e) => setCrNumber(e.target.value)} className="h-11" />
                </Field>
                <Field label={t('validationDate')} error={errors.validationDate}>
                  <Input
                    type="date"
                    value={validationDate}
                    onChange={(e) => setValidationDate(e.target.value)}
                    className="h-11"
                  />
                </Field>
                <FileField
                  label={t('registrationFile')}
                  error={errors.registrationFile}
                  file={registrationFile}
                  onChange={setRegistrationFile}
                  accept=".pdf,.jpg,.jpeg,.png"
                  previewVariant="document"
                />
                <FileField
                  label={t('companyLogo')}
                  error={errors.logoFile}
                  file={logoFile}
                  onChange={setLogoFile}
                  accept="image/*"
                  previewVariant="logo"
                />
                <FileField
                  label={t('companyCover')}
                  error={errors.coverFile}
                  file={coverFile}
                  onChange={setCoverFile}
                  accept="image/*"
                  previewVariant="cover"
                />
              </>
            )}

            <Button type="submit" size="lg" className="mt-4 w-full bg-gold-400 text-white hover:bg-gold-500">
              {accountType === 'reviewer' ? t('saveReviewerProfile') : t('submitCompanyProfile')}
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
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
  accept,
  previewVariant = 'document',
}: {
  label: string;
  error?: string;
  file: File | null;
  onChange: (file: File | null) => void;
  accept: string;
  previewVariant?: 'avatar' | 'logo' | 'cover' | 'document';
}) {
  const t = useTranslations('profilePage');
  const inputRef = useRef<HTMLInputElement>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const previewUrl = useFilePreview(file);
  const isPdf = file?.type === 'application/pdf';
  const showImagePreview = Boolean(previewUrl);

  const handleFileChange = (selected: File | null) => {
    if (!selected) {
      onChange(null);
      setSizeError(null);
      return;
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setSizeError(t('errors.fileTooLarge'));
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setSizeError(null);
    onChange(selected);
  };

  const handleRemove = () => {
    onChange(null);
    setSizeError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const displayError = sizeError ?? error;

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <p className="mb-2 text-xs text-ink-muted">{t('maxFileSize')}</p>

      {showImagePreview && (
        <div
          className={cn(
            'relative mb-3 overflow-hidden border border-slate-200 bg-slate-50',
            previewVariant === 'avatar' && 'h-24 w-24 rounded-full',
            previewVariant === 'logo' && 'h-24 w-24 rounded-2xl',
            (previewVariant === 'cover' || previewVariant === 'document') &&
              'h-36 w-full rounded-2xl',
          )}
        >
          <img src={previewUrl!} alt={t('imagePreviewAlt')} className="h-full w-full object-cover" />
          <RemovePreviewButton onClick={handleRemove} label={t('removeFile')} />
        </div>
      )}

      {file && isPdf && (
        <div className="relative mb-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pe-12">
          <FileText className="h-8 w-8 shrink-0 text-brand-500" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{file.name}</p>
            <p className="text-xs text-ink-muted">{t('pdfSelected')}</p>
          </div>
          <RemovePreviewButton onClick={handleRemove} label={t('removeFile')} className="end-2 top-2" />
        </div>
      )}

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-3 hover:border-brand-400 hover:bg-brand-50/40">
        <div className="flex min-w-0 items-center gap-3">
          <Upload className="h-4 w-4 shrink-0 text-brand-500" />
          <span className="truncate text-sm text-ink-muted">
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
