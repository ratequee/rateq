'use client';

import { CompanySocialLinksFields } from '@/components/profile/company-social-links-fields';
import { DashboardProfileLoading } from '@/components/dashboard/dashboard-profile-loading';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/components/providers/profile-provider';
import { onboardingApi } from '@/lib/onboarding-api';
import { ApiError } from '@/lib/api';
import type { CompanyProfileDetail, CompanySocialLinks } from '@rateq/types';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

function CompanySocialLinksFormFields({ company }: { company: CompanyProfileDetail }) {
  const t = useTranslations('profilePage');
  const { refreshOnboarding } = useProfile();

  const [socialLinks, setSocialLinks] = useState<CompanySocialLinks>(
    () =>
      company.socialLinks ?? {
        whatsappNumber: null,
        instagramUrl: null,
        youtubeUrl: null,
        facebookUrl: null,
        linkedinUrl: null,
        twitterUrl: null,
      },
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setSubmitting(true);
    try {
      await onboardingApi.updateCompany({
        whatsappNumber: socialLinks.whatsappNumber,
        instagramUrl: socialLinks.instagramUrl,
        youtubeUrl: socialLinks.youtubeUrl,
        facebookUrl: socialLinks.facebookUrl,
        linkedinUrl: socialLinks.linkedinUrl,
        twitterUrl: socialLinks.twitterUrl,
      });

      await refreshOnboarding();
      toast.success(t('socialLinksUpdated'));
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
      className="space-y-5 rounded-2xl border border-subtle surface-card p-6 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-primary">{t('socialLinksTitle')}</h2>
        <p className="mt-1 text-sm text-secondary">{t('socialLinksCardSubtitle')}</p>
      </div>

      <CompanySocialLinksFields
        values={socialLinks}
        onChange={(patch) => setSocialLinks((current) => ({ ...current, ...patch }))}
      />

      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? t('saving') : t('saveSocialLinks')}
      </Button>
    </form>
  );
}

export function CompanySocialLinksForm() {
  const { onboarding, isLoading: profileLoading } = useProfile();
  const company = onboarding?.company;

  if (profileLoading) return <DashboardProfileLoading />;
  if (!company) return null;

  return <CompanySocialLinksFormFields key={company.updatedAt} company={company} />;
}
