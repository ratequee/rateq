'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Share2, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface ShareLinkButtonProps {
  /** Path after locale, e.g. `/companies/acme` or `/companies/acme/projects/villa` */
  path: string;
  name: string;
  subtitle?: string;
  buttonLabel?: string;
  className?: string;
}

export function ShareLinkButton({
  path,
  name,
  subtitle,
  buttonLabel,
  className,
}: ShareLinkButtonProps) {
  const t = useTranslations('companyPage');
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${window.location.origin}/${locale}${normalized}`;
  }, [locale, path, open]);

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
        className={className ?? 'gap-2'}
      >
        <Share2 className="h-4 w-4" />
        {buttonLabel ?? t('share')}
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('shareTitle', { name })}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-dm-surface">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-primary">{t('shareTitle', { name })}</h3>
                <p className="mt-1 text-sm text-secondary">{subtitle ?? t('shareSubtitle')}</p>
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
