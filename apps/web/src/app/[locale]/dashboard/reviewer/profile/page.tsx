'use client';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DashboardProfileLoading } from '@/components/dashboard/dashboard-profile-loading';
import { useAuth } from '@/components/providers/auth-provider';
import { useProfile } from '@/components/providers/profile-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QatarPhoneInput } from '@/components/ui/qatar-phone-input';
import { extractQatarPhoneDigits, formatQatarPhoneForSubmit } from '@/lib/qatar-phone';
import { useRequireCompleteProfile } from '@/hooks/use-require-verified-auth';
import { waitForFirebaseUser } from '@/lib/firebase/wait-for-user';
import { uploadUserFile } from '@/lib/firebase/storage';
import { onboardingApi } from '@/lib/onboarding-api';
import { ApiError } from '@/lib/api';
import { sanitizeDisplayName } from '@/lib/validation/auth-fields';
import {
  hasValidationErrors,
  validateReviewerSettingsFields,
} from '@/lib/validation/profile-fields';
import type { ReviewerProfile } from '@rateq/types';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

function ReviewerSettingsForm({ profile }: { profile: ReviewerProfile }) {
  const t = useTranslations('profilePage');
  const ta = useTranslations('authPage');
  const { user } = useAuth();
  const { refreshOnboarding } = useProfile();

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fullName, setFullName] = useState(() => profile.fullName);
  const [phone] = useState(() => extractQatarPhoneDigits(profile.phone));
  const [city, setCity] = useState(() => profile.city);
  const [country, setCountry] = useState(() => profile.country);
  const [bio, setBio] = useState(() => profile.bio);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl] = useState<string | null>(() => profile.avatarUrl);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    const fieldErrors = validateReviewerSettingsFields(
      {
        fullName,
        city,
        country,
        bio,
        avatar,
        hasExistingAvatar: Boolean(avatarUrl),
      },
      {
        name: {
          required: ta('validationNameRequired'),
          invalid: ta('validationNameInvalid'),
          min: ta('validationNameMin'),
          max: ta('validationNameMax'),
        },
        location: { required: t('errors.required') },
        bio: { max: t('errors.bioMax') },
        avatar: { required: t('errors.required'), fileTooLarge: t('errors.fileTooLarge') },
      },
    );

    setErrors(fieldErrors);
    if (hasValidationErrors(fieldErrors)) {
      toast.error(t('errors.fixForm'));
      return;
    }

    setSubmitting(true);
    try {
      let nextAvatarUrl = avatarUrl;
      if (avatar) {
        await waitForFirebaseUser();
        nextAvatarUrl = await uploadUserFile(user.id, 'avatar', avatar);
      }

      if (!nextAvatarUrl) throw new Error(t('errors.required'));

      await onboardingApi.completeReviewer({
        fullName: fullName.trim(),
        phone: formatQatarPhoneForSubmit(phone),
        city: city.trim(),
        country: country.trim(),
        bio: bio.trim(),
        avatarUrl: nextAvatarUrl,
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
      className="space-y-4 rounded-2xl surface-card border p-6 shadow-sm"
    >
      <Field label={t('fullName')} error={errors.fullName} required>
        <Input
          value={fullName}
          onChange={(e) => setFullName(sanitizeDisplayName(e.target.value))}
          className="h-11"
        />
      </Field>
      <Field label={t('phone')} error={errors.phone} required>
        <QatarPhoneInput
          value={phone}
          readOnly
          disabled
          className="bg-slate-50 dark:bg-slate-800"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('city')} error={errors.city} required>
          <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-11" />
        </Field>
        <Field label={t('country')} error={errors.country} required>
          <Input value={country} onChange={(e) => setCountry(e.target.value)} className="h-11" />
        </Field>
      </div>
      <Field label={t('bio')} error={errors.bio} optionalLabel={t('bioOptional')}>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={500}
          className="textarea-field"
        />
      </Field>
      <Field label={t('profileImage')} error={errors.avatar} required>
        {avatarUrl && !avatar ? (
          <img src={avatarUrl} alt="" className="mb-3 h-24 w-24 rounded-full object-cover" />
        ) : null}
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
        />
      </Field>
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? t('saving') : t('saveChanges')}
      </Button>
    </form>
  );
}

export default function ReviewerProfileSettingsPage() {
  const t = useTranslations('profilePage');
  const { user } = useAuth();
  const { onboarding, isLoading: profileLoading } = useProfile();
  useRequireCompleteProfile();

  const profile = onboarding?.reviewerProfile;

  return (
    <DashboardShell role="reviewer">
      <div className="mx-auto max-w-2xl">
        <DashboardPageHeader
          title={t('profileSettingsTitle')}
          subtitle={t('profileSettingsSubtitle')}
        />
        {user?.email ? (
          <p className="-mt-4 mb-6 text-sm text-secondary dark:text-slate-300">
            {t('accountEmailLabel')}:{' '}
            <span className="font-medium text-primary dark:text-white">{user.email}</span>
          </p>
        ) : null}

        {profileLoading ? (
          <DashboardProfileLoading />
        ) : profile ? (
          <ReviewerSettingsForm key={profile.phone} profile={profile} />
        ) : null}
      </div>
    </DashboardShell>
  );
}

function Field({
  label,
  error,
  children,
  required = false,
  optionalLabel,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
  optionalLabel?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-primary">
        {label}
        {required && <span className="text-red-500"> *</span>}
        {optionalLabel ? (
          <span className="ms-1 font-normal text-secondary">({optionalLabel})</span>
        ) : null}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
