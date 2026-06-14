'use client';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useAuth } from '@/components/providers/auth-provider';
import { useProfile } from '@/components/providers/profile-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRequireCompleteProfile } from '@/hooks/use-require-verified-auth';
import { waitForFirebaseUser } from '@/lib/firebase/wait-for-user';
import { uploadUserFile } from '@/lib/firebase/storage';
import { onboardingApi } from '@/lib/onboarding-api';
import { ApiError } from '@/lib/api';
import { sanitizeDisplayName } from '@/lib/validation/auth-fields';
import {
  hasValidationErrors,
  validateReviewerProfileFields,
} from '@/lib/validation/profile-fields';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ReviewerProfileSettingsPage() {
  const t = useTranslations('profilePage');
  const ta = useTranslations('authPage');
  const { user } = useAuth();
  const { onboarding, refreshOnboarding } = useProfile();
  useRequireCompleteProfile();

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!onboarding?.reviewerProfile) return;
    const profile = onboarding.reviewerProfile;
    setFullName(profile.fullName);
    setPhone(profile.phone);
    setCity(profile.city);
    setCountry(profile.country);
    setBio(profile.bio);
    setAvatarUrl(profile.avatarUrl);
  }, [onboarding?.reviewerProfile]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    const fieldErrors = validateReviewerProfileFields(
      {
        fullName,
        phone,
        city,
        country,
        bio,
        avatar,
        hasExistingAvatar: Boolean(avatarUrl),
        phoneVerified: true,
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
        phone: phone.trim(),
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
    <DashboardShell role="reviewer">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink">{t('profileSettingsTitle')}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t('profileSettingsSubtitle')}</p>
          {user?.email && (
            <p className="mt-2 text-sm text-ink-muted">
              {t('accountEmailLabel')}: <span className="font-medium text-ink">{user.email}</span>
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
        >
          <Field label={t('fullName')} error={errors.fullName} required>
            <Input
              value={fullName}
              onChange={(e) => setFullName(sanitizeDisplayName(e.target.value))}
              className="h-11"
            />
          </Field>
          <Field label={t('phone')} error={errors.phone} required>
            <Input
              type="tel"
              value={phone}
              placeholder={t('phonePlaceholder')}
              className="h-11 bg-slate-50"
              disabled
              readOnly
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('city')} error={errors.city} required>
              <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-11" />
            </Field>
            <Field label={t('country')} error={errors.country} required>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="h-11"
              />
            </Field>
          </div>
          <Field label={t('bio')} error={errors.bio} optionalLabel={t('bioOptional')}>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </Field>
          <Field label={t('profileImage')} error={errors.avatar} required>
            {avatarUrl && !avatar && (
              <img src={avatarUrl} alt="" className="mb-3 h-24 w-24 rounded-full object-cover" />
            )}
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
