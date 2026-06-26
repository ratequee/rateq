'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Share2, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface CompanyShareButtonProps {
  slug: string;
  companyName: string;
}

export function CompanyShareButton({ slug, companyName }: CompanyShareButtonProps) {
  const t = useTranslations('companyPage');
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    return `${origin}/${locale}/companies/${slug}`;
  }, [locale, slug, open]);

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('linkCopied'));
    } catch {
      toast.error(t('copyFailed'));
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Share2 className="h-4 w-4" />
        {t('share')}
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('shareTitle', { name: companyName })}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-dm-surface">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-primary">
                  {t('shareTitle', { name: companyName })}
                </h3>
                <p className="mt-1 text-sm text-secondary">{t('shareSubtitle')}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-ink-muted hover:bg-slate-100 dark:hover:bg-dm-elevated"
                aria-label={t('closeShare')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="rounded-xl border border-subtle bg-white p-4 dark:bg-dm-elevated">
                <QRCodeSVG value={shareUrl || ' '} size={180} level="M" />
              </div>

              <div className="flex w-full gap-2">
                <Input readOnly value={shareUrl} className="h-10 text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={copyLink}
                  className="shrink-0 gap-1"
                >
                  <Copy className="h-4 w-4" />
                  {t('copyLink')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
