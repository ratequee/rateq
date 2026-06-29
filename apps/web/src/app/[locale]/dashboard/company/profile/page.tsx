'use client';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DashboardProfileLoading } from '@/components/dashboard/dashboard-profile-loading';
import { CompanyPublicProfileForm } from '@/components/dashboard/company-public-profile-form';
import { CompanySocialLinksForm } from '@/components/dashboard/company-social-links-form';
import { CompanySettingsForm } from '@/components/dashboard/company-settings-form';
import { useProfile } from '@/components/providers/profile-provider';
import { useRequireCompleteProfile } from '@/hooks/use-require-verified-auth';
import { isRemoteImage, isRemotePdf } from '@/lib/profile-company-assets';
import { ExternalLink, FileText } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';

export default function CompanyProfileSettingsPage() {
  const t = useTranslations('profilePage');
  const locale = useLocale();
  const { onboarding, isLoading: profileLoading } = useProfile();
  useRequireCompleteProfile();

  const company = onboarding?.company;

  const registrationDetails = useMemo(() => {
    if (!company) return [];

    const items: Array<{ label: string; value: string }> = [];

    if (company.crNumber) {
      items.push({ label: t('crNumber'), value: company.crNumber });
    }

    if (company.validationDate) {
      items.push({
        label: t('validationDate'),
        value: new Date(company.validationDate).toLocaleDateString(locale),
      });
    }

    return items;
  }, [company, locale, t]);

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

  return (
    <DashboardShell role="company">
      <div className="mx-auto max-w-2xl">
        <DashboardPageHeader
          title={t('profileSettingsTitle')}
          subtitle={t('profileSettingsSubtitle')}
        />
        {company?.email ? (
          <p className="-mt-4 mb-6 text-sm text-secondary dark:text-slate-300">
            {t('accountEmailLabel')}:{' '}
            <span className="font-medium text-primary dark:text-white">{company.email}</span>
          </p>
        ) : null}

        {profileLoading ? (
          <DashboardProfileLoading />
        ) : company ? (
          <>
            {(registrationDetails.length > 0 || documents.length > 0) && (
              <section className="mb-6 rounded-2xl surface-card border p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-primary">
                  {t('submittedDocumentsTitle')}
                </h2>
                <p className="mt-1 text-sm text-secondary">{t('submittedDocumentsHint')}</p>

                {registrationDetails.length > 0 ? (
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    {registrationDetails.map(({ label, value }) => (
                      <div
                        key={label}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-dm-border dark:bg-dm-elevated"
                      >
                        <dt className="text-xs font-medium text-secondary">{label}</dt>
                        <dd className="mt-1 text-sm font-medium text-primary">{value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                {documents.length > 0 ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {documents.map((document) => (
                      <DocumentPreviewCard
                        key={document.label}
                        label={document.label}
                        url={document.url!}
                      />
                    ))}
                  </div>
                ) : null}
              </section>
            )}

            <CompanySettingsForm key={company.updatedAt} company={company} />

            <div className="space-y-6">
              <CompanySocialLinksForm />
              <CompanyPublicProfileForm />
            </div>
          </>
        ) : null}
      </div>
    </DashboardShell>
  );
}

function DocumentPreviewCard({ label, url }: { label: string; url: string }) {
  const t = useTranslations('profilePage');

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-dm-border">
      <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-primary dark:border-dm-border dark:bg-dm-elevated">
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
          className="flex items-center justify-center gap-2 p-6 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-dm-elevated"
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
