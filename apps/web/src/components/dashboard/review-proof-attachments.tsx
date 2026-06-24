'use client';

import type { ReviewAttachmentPublic } from '@rateq/types';
import { ExternalLink, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { isRemoteImage, isRemotePdf } from '@/lib/profile-company-assets';

interface ReviewProofAttachmentsProps {
  attachments?: ReviewAttachmentPublic[];
}

export function ReviewProofAttachments({ attachments }: ReviewProofAttachmentsProps) {
  const t = useTranslations('dashboardReviews');

  if (!attachments?.length) return null;

  return (
    <div className="rounded-xl border border-default surface-muted p-4">
      <p className="mb-3 text-sm font-semibold text-primary">{t('proofFiles')}</p>
      <ul className="space-y-2">
        {attachments.map((attachment, index) => {
          const label = attachment.fileName?.trim() || t('proofFileLabel', { index: index + 1 });
          const isImage = isRemoteImage(attachment.url);
          const isPdf = isRemotePdf(attachment.url);

          return (
            <li key={attachment.id}>
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-subtle bg-white p-3 transition-colors hover:border-brand-300 dark:bg-slate-900"
              >
                {isImage ? (
                  <img
                    src={attachment.url}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
                    <FileText className="h-6 w-6 text-brand-500" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-primary">{label}</p>
                  <p className="text-xs text-secondary">
                    {isPdf ? t('proofPdf') : isImage ? t('proofImage') : t('proofDocument')}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-secondary" />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
