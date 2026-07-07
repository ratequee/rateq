'use client';

import { ExternalLink, FileText, ImageIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AdminCompanyDocumentsSectionProps {
  registrationDocUrl?: string | null;
  establishmentCardUrl?: string | null;
  tradeLicenseUrl?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
}

export function AdminCompanyDocumentsSection({
  registrationDocUrl,
  establishmentCardUrl,
  tradeLicenseUrl,
  logoUrl,
  coverUrl,
}: AdminCompanyDocumentsSectionProps) {
  const t = useTranslations('adminCompanies');

  return (
    <section>
      <h4 className="mb-3 text-sm font-semibold text-primary">{t('documents')}</h4>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DocumentCard
          label={t('establishmentCard')}
          url={establishmentCardUrl}
          icon={<FileText className="h-8 w-8 text-brand-500" />}
        />
        <DocumentCard
          label={t('tradeLicense')}
          url={tradeLicenseUrl}
          icon={<FileText className="h-8 w-8 text-brand-500" />}
        />
        <DocumentCard
          label={t('registrationDoc')}
          url={registrationDocUrl}
          icon={<FileText className="h-8 w-8 text-brand-500" />}
        />
        <DocumentCard
          label={t('logo')}
          url={logoUrl}
          icon={<ImageIcon className="h-8 w-8 text-brand-500" />}
          image
        />
        <DocumentCard
          label={t('cover')}
          url={coverUrl}
          icon={<ImageIcon className="h-8 w-8 text-brand-500" />}
          image
        />
      </div>
    </section>
  );
}

function DocumentCard({
  label,
  url,
  icon,
  image = false,
}: {
  label: string;
  url: string | null | undefined;
  icon: React.ReactNode;
  image?: boolean;
}) {
  const t = useTranslations('adminCompanies');

  if (!url) {
    return (
      <div className="rounded-xl border border-dashed border-subtle p-4 text-center text-sm text-secondary">
        {label}: {t('notProvided')}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-subtle">
      <div className="border-b border-subtle bg-slate-50 px-3 py-2 text-xs font-medium text-primary dark:bg-dm-elevated/60">
        {label}
      </div>
      {image ? (
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
          {icon}
          <span className="flex items-center gap-1">
            {t('openDocument')}
            <ExternalLink className="h-3.5 w-3.5" />
          </span>
        </a>
      )}
    </div>
  );
}
