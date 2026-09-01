'use client';

import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRequireAdmin } from '@/hooks/use-require-admin';
import { adminEmailMarketingApi } from '@/lib/admin-email-marketing-api';
import { ApiError } from '@/lib/api';
import { AdminPermission } from '@rateq/types';
import { Loader2, Mail, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseRecipients(raw: string): string[] {
  const values = raw
    .split(/[\n,;]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(values)];
}

export default function AdminEmailMarketingPage() {
  const t = useTranslations('adminEmailMarketing');
  useRequireAdmin(AdminPermission.CONTENT);

  const [recipientsRaw, setRecipientsRaw] = useState('');
  const [subject, setSubject] = useState('');
  const [heading, setHeading] = useState('');
  const [message, setMessage] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [sending, setSending] = useState(false);

  const recipients = useMemo(() => parseRecipients(recipientsRaw), [recipientsRaw]);
  const invalidRecipients = useMemo(
    () => recipients.filter((email) => !EMAIL_PATTERN.test(email)),
    [recipients],
  );
  const validRecipients = useMemo(
    () => recipients.filter((email) => EMAIL_PATTERN.test(email)),
    [recipients],
  );

  const handleSend = async () => {
    if (validRecipients.length === 0) {
      toast.error(t('recipientsRequired'));
      return;
    }

    if (invalidRecipients.length > 0) {
      toast.error(t('invalidRecipients', { count: invalidRecipients.length }));
      return;
    }

    if (!subject.trim() || !heading.trim() || !message.trim()) {
      toast.error(t('fieldsRequired'));
      return;
    }

    if (ctaLabel.trim() && !ctaUrl.trim()) {
      toast.error(t('ctaUrlRequired'));
      return;
    }

    if (
      !window.confirm(
        t('sendConfirm', {
          count: validRecipients.length,
        }),
      )
    ) {
      return;
    }

    setSending(true);
    try {
      const result = await adminEmailMarketingApi.send({
        recipients: validRecipients,
        subject: subject.trim(),
        heading: heading.trim(),
        message: message.trim(),
        ctaLabel: ctaLabel.trim() || undefined,
        ctaUrl: ctaUrl.trim() || undefined,
      });

      if (result.failed.length > 0) {
        toast.error(t('partialFailure', { sent: result.sent, failed: result.failed.length }));
      } else {
        toast.success(t('sendSuccess', { count: result.sent }));
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('sendError'));
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardShell role="admin">
      <div className="mx-auto max-w-4xl">
        <DashboardPageHeader title={t('title')} subtitle={t('subtitle')} className="mb-6" />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <form
            className="space-y-5 surface-card rounded-2xl border p-5 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend();
            }}
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                {t('recipientsLabel')}
              </label>
              <textarea
                value={recipientsRaw}
                onChange={(event) => setRecipientsRaw(event.target.value)}
                placeholder={t('recipientsPlaceholder')}
                rows={6}
                className="textarea-field rounded-xl font-mono text-sm"
              />
              <p className="mt-2 text-xs text-ink-muted">
                {t('recipientsHint', { count: validRecipients.length })}
              </p>
              {invalidRecipients.length > 0 ? (
                <p className="mt-1 text-xs text-red-600">
                  {t('invalidRecipients', { count: invalidRecipients.length })}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                {t('subjectLabel')}
              </label>
              <Input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder={t('subjectPlaceholder')}
                className="h-11"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                {t('headingLabel')}
              </label>
              <Input
                value={heading}
                onChange={(event) => setHeading(event.target.value)}
                placeholder={t('headingPlaceholder')}
                className="h-11"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                {t('messageLabel')}
              </label>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={t('messagePlaceholder')}
                rows={8}
                className="textarea-field rounded-xl"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">{t('ctaLabel')}</label>
                <Input
                  value={ctaLabel}
                  onChange={(event) => setCtaLabel(event.target.value)}
                  placeholder={t('ctaLabelPlaceholder')}
                  className="h-11"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  {t('ctaUrlLabel')}
                </label>
                <Input
                  value={ctaUrl}
                  onChange={(event) => setCtaUrl(event.target.value)}
                  placeholder={t('ctaUrlPlaceholder')}
                  className="h-11"
                />
              </div>
            </div>

            <Button type="submit" disabled={sending} className="gap-2">
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {sending ? t('sending') : t('send')}
            </Button>
          </form>

          <aside className="surface-card h-fit rounded-2xl border p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink">
              <Mail className="h-4 w-4 text-brand-500" />
              {t('previewTitle')}
            </div>

            <div className="overflow-hidden rounded-xl border border-subtle bg-white dark:bg-dm-elevated">
              <div className="bg-brand-500 px-4 py-5 text-center text-sm font-semibold text-white">
                RateQ
              </div>
              <div className="space-y-3 p-4">
                <p className="text-base font-bold text-ink">
                  {heading.trim() || t('headingPreview')}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-6 text-ink-muted">
                  {message.trim() || t('messagePreview')}
                </p>
                {ctaLabel.trim() ? (
                  <div className="pt-2">
                    <span className="inline-flex rounded-full bg-gold-300 px-4 py-2 text-sm font-semibold text-brand-700">
                      {ctaLabel.trim()}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <p className="mt-4 text-xs text-ink-muted">{t('previewNote')}</p>
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}
