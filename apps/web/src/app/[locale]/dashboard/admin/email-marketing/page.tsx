'use client';

import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRequireAdmin } from '@/hooks/use-require-admin';
import { adminEmailMarketingApi } from '@/lib/admin-email-marketing-api';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { AdminPermission } from '@rateq/types';
import { Loader2, Mail, Send } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type ContentLocale = 'en' | 'ar';

function parseRecipients(raw: string): string[] {
  const values = raw
    .split(/[\n,;]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(values)];
}

function MarketingEmailPreview({
  subjectEn,
  subjectAr,
  headingEn,
  headingAr,
  messageEn,
  messageAr,
  ctaLabelEn,
  ctaLabelAr,
  labels,
}: {
  subjectEn: string;
  subjectAr: string;
  headingEn: string;
  headingAr: string;
  messageEn: string;
  messageAr: string;
  ctaLabelEn: string;
  ctaLabelAr: string;
  labels: {
    previewTitle: string;
    previewNote: string;
    headingPreview: string;
    messagePreview: string;
    englishSection: string;
    arabicSection: string;
    tagline: string;
  };
}) {
  return (
    <aside className="surface-card h-fit rounded-2xl border p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink">
        <Mail className="h-4 w-4 text-brand-500" />
        {labels.previewTitle}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#f3f4f6] shadow-sm">
        <div className="bg-gradient-to-br from-brand-500 to-[#5a0f1c] px-5 py-6 text-center">
          <Image
            src="/images/white_logo.svg"
            alt="RateQ"
            width={120}
            height={32}
            className="mx-auto h-8 w-auto"
          />
          <p className="mt-3 text-xs text-white/85">{labels.tagline}</p>
        </div>

        <div className="bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-500">
            RateQ Update
          </p>
          <h3 className="mt-2 text-lg font-bold leading-snug text-ink">
            {headingEn.trim() || labels.headingPreview}
          </h3>
          <h3
            className="mt-2 text-lg font-bold leading-snug text-ink"
            dir="rtl"
            style={{ textAlign: 'right' }}
          >
            {headingAr.trim() || labels.headingPreview}
          </h3>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-500">
              {labels.englishSection}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {messageEn.trim() || labels.messagePreview}
            </p>
            {ctaLabelEn.trim() ? (
              <span className="mt-4 inline-flex rounded-full bg-gold-300 px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm">
                {ctaLabelEn.trim()}
              </span>
            ) : null}
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-500"
              dir="rtl"
              style={{ textAlign: 'right' }}
            >
              {labels.arabicSection}
            </p>
            <p
              className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600"
              dir="rtl"
              style={{ textAlign: 'right' }}
            >
              {messageAr.trim() || labels.messagePreview}
            </p>
            {ctaLabelAr.trim() ? (
              <div className="mt-4 flex justify-end">
                <span className="inline-flex rounded-full bg-gold-300 px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm">
                  {ctaLabelAr.trim()}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="h-1 bg-gradient-to-r from-gold-300 via-brand-500 to-[#5a0f1c]" />
      </div>

      <p className="mt-3 text-xs text-ink-muted">
        <span className="font-medium text-ink">Subject:</span> {subjectEn.trim() || '—'} |{' '}
        {subjectAr.trim() || '—'}
      </p>
      <p className="mt-2 text-xs text-ink-muted">{labels.previewNote}</p>
    </aside>
  );
}

export default function AdminEmailMarketingPage() {
  const t = useTranslations('adminEmailMarketing');
  useRequireAdmin(AdminPermission.CONTENT);

  const [recipientsRaw, setRecipientsRaw] = useState('');
  const [activeLocale, setActiveLocale] = useState<ContentLocale>('en');
  const [subjectEn, setSubjectEn] = useState('');
  const [subjectAr, setSubjectAr] = useState('');
  const [headingEn, setHeadingEn] = useState('');
  const [headingAr, setHeadingAr] = useState('');
  const [messageEn, setMessageEn] = useState('');
  const [messageAr, setMessageAr] = useState('');
  const [ctaLabelEn, setCtaLabelEn] = useState('');
  const [ctaLabelAr, setCtaLabelAr] = useState('');
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

  const activeLocaleLabel = activeLocale === 'en' ? t('englishTab') : t('arabicTab');

  const handleSend = async () => {
    if (validRecipients.length === 0) {
      toast.error(t('recipientsRequired'));
      return;
    }

    if (invalidRecipients.length > 0) {
      toast.error(t('invalidRecipients', { count: invalidRecipients.length }));
      return;
    }

    if (
      !subjectEn.trim() ||
      !subjectAr.trim() ||
      !headingEn.trim() ||
      !headingAr.trim() ||
      !messageEn.trim() ||
      !messageAr.trim()
    ) {
      toast.error(t('fieldsRequired'));
      return;
    }

    if ((ctaLabelEn.trim() || ctaLabelAr.trim()) && !ctaUrl.trim()) {
      toast.error(t('ctaUrlRequired'));
      return;
    }

    if (ctaLabelEn.trim() && !ctaLabelAr.trim()) {
      toast.error(t('ctaLabelsRequired'));
      return;
    }

    if (ctaLabelAr.trim() && !ctaLabelEn.trim()) {
      toast.error(t('ctaLabelsRequired'));
      return;
    }

    if (!window.confirm(t('sendConfirm', { count: validRecipients.length }))) {
      return;
    }

    setSending(true);
    try {
      const result = await adminEmailMarketingApi.send({
        recipients: validRecipients,
        subjectEn: subjectEn.trim(),
        subjectAr: subjectAr.trim(),
        headingEn: headingEn.trim(),
        headingAr: headingAr.trim(),
        messageEn: messageEn.trim(),
        messageAr: messageAr.trim(),
        ctaLabelEn: ctaLabelEn.trim() || undefined,
        ctaLabelAr: ctaLabelAr.trim() || undefined,
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
      <div className="mx-auto max-w-5xl">
        <DashboardPageHeader title={t('title')} subtitle={t('subtitle')} className="mb-6" />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
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
                rows={5}
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  {t('subjectEnLabel')}
                </label>
                <Input
                  value={subjectEn}
                  onChange={(event) => setSubjectEn(event.target.value)}
                  placeholder={t('subjectEnPlaceholder')}
                  className="h-11"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  {t('subjectArLabel')}
                </label>
                <Input
                  value={subjectAr}
                  onChange={(event) => setSubjectAr(event.target.value)}
                  placeholder={t('subjectArPlaceholder')}
                  className="h-11"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="flex gap-2 border-b border-subtle pb-2">
              {(['en', 'ar'] as ContentLocale[]).map((locale) => (
                <button
                  key={locale}
                  type="button"
                  onClick={() => setActiveLocale(locale)}
                  className={cn(
                    'dashboard-tab rounded-lg px-4 py-2 text-sm font-medium',
                    activeLocale === locale ? 'dashboard-tab-active' : 'dashboard-tab-inactive',
                  )}
                >
                  {locale === 'en' ? t('englishTab') : t('arabicTab')}
                </button>
              ))}
            </div>

            {activeLocale === 'en' ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    {t('headingLabel')} ({activeLocaleLabel})
                  </label>
                  <Input
                    value={headingEn}
                    onChange={(event) => setHeadingEn(event.target.value)}
                    placeholder={t('headingEnPlaceholder')}
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    {t('messageLabel')} ({activeLocaleLabel})
                  </label>
                  <textarea
                    value={messageEn}
                    onChange={(event) => setMessageEn(event.target.value)}
                    placeholder={t('messageEnPlaceholder')}
                    rows={7}
                    className="textarea-field rounded-xl"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    {t('ctaLabel')} ({activeLocaleLabel})
                  </label>
                  <Input
                    value={ctaLabelEn}
                    onChange={(event) => setCtaLabelEn(event.target.value)}
                    placeholder={t('ctaLabelEnPlaceholder')}
                    className="h-11"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    {t('headingLabel')} ({activeLocaleLabel})
                  </label>
                  <Input
                    value={headingAr}
                    onChange={(event) => setHeadingAr(event.target.value)}
                    placeholder={t('headingArPlaceholder')}
                    className="h-11"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    {t('messageLabel')} ({activeLocaleLabel})
                  </label>
                  <textarea
                    value={messageAr}
                    onChange={(event) => setMessageAr(event.target.value)}
                    placeholder={t('messageArPlaceholder')}
                    rows={7}
                    className="textarea-field rounded-xl"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    {t('ctaLabel')} ({activeLocaleLabel})
                  </label>
                  <Input
                    value={ctaLabelAr}
                    onChange={(event) => setCtaLabelAr(event.target.value)}
                    placeholder={t('ctaLabelArPlaceholder')}
                    className="h-11"
                    dir="rtl"
                  />
                </div>
              </div>
            )}

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

            <Button type="submit" disabled={sending} className="gap-2">
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {sending ? t('sending') : t('send')}
            </Button>
          </form>

          <MarketingEmailPreview
            subjectEn={subjectEn}
            subjectAr={subjectAr}
            headingEn={headingEn}
            headingAr={headingAr}
            messageEn={messageEn}
            messageAr={messageAr}
            ctaLabelEn={ctaLabelEn}
            ctaLabelAr={ctaLabelAr}
            labels={{
              previewTitle: t('previewTitle'),
              previewNote: t('previewNote'),
              headingPreview: t('headingPreview'),
              messagePreview: t('messagePreview'),
              englishSection: t('englishTab'),
              arabicSection: t('arabicTab'),
              tagline: t('emailTagline'),
            }}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
