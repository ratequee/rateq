'use client';

import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRequireAdmin } from '@/hooks/use-require-admin';
import { adminApi } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import {
  AdminPermission,
  type SiteSettingsPublic,
  type UpdateSiteSettingsInput,
} from '@rateq/types';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const EMPTY_FORM: UpdateSiteSettingsInput = {
  address: '',
  phone: '',
  email: '',
  website: '',
  facebookUrl: '',
  twitterUrl: '',
  youtubeUrl: '',
  linkedinUrl: '',
  aboutTextEn: '',
  aboutTextAr: '',
};

function toForm(settings: SiteSettingsPublic): UpdateSiteSettingsInput {
  return {
    address: settings.address ?? '',
    phone: settings.phone ?? '',
    email: settings.email ?? '',
    website: settings.website ?? '',
    facebookUrl: settings.facebookUrl ?? '',
    twitterUrl: settings.twitterUrl ?? '',
    youtubeUrl: settings.youtubeUrl ?? '',
    linkedinUrl: settings.linkedinUrl ?? '',
    aboutTextEn: settings.aboutTextEn ?? '',
    aboutTextAr: settings.aboutTextAr ?? '',
  };
}

function toPayload(form: UpdateSiteSettingsInput): UpdateSiteSettingsInput {
  const normalize = (value: string | null | undefined) => {
    const trimmed = value?.trim() ?? '';
    return trimmed.length ? trimmed : null;
  };
  return {
    address: normalize(form.address),
    phone: normalize(form.phone),
    email: normalize(form.email),
    website: normalize(form.website),
    facebookUrl: normalize(form.facebookUrl),
    twitterUrl: normalize(form.twitterUrl),
    youtubeUrl: normalize(form.youtubeUrl),
    linkedinUrl: normalize(form.linkedinUrl),
    aboutTextEn: normalize(form.aboutTextEn),
    aboutTextAr: normalize(form.aboutTextAr),
  };
}

export default function AdminSiteSettingsPage() {
  const t = useTranslations('adminSettings');
  useRequireAdmin(AdminPermission.CONTENT);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpdateSiteSettingsInput>(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const settings = await adminApi.getSiteSettings();
      setForm(toForm(settings));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('loadError');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateField = (key: keyof UpdateSiteSettingsInput, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await adminApi.updateSiteSettings(toPayload(form));
      setForm(toForm(updated));
      toast.success(t('saveSuccess'));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('saveError');
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell role="admin">
      <DashboardPageHeader title={t('title')} subtitle={t('subtitle')} />

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-secondary">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t('loading')}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
          <section className="surface-card space-y-4 rounded-2xl border p-5 sm:p-6">
            <h2 className="text-base font-semibold text-primary">{t('sections.contact')}</h2>
            <Field label={t('fields.address')}>
              <Input
                value={form.address ?? ''}
                onChange={(e) => updateField('address', e.target.value)}
                className="h-11"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('fields.phone')}>
                <Input
                  value={form.phone ?? ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="h-11"
                  dir="ltr"
                />
              </Field>
              <Field label={t('fields.email')}>
                <Input
                  type="email"
                  value={form.email ?? ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="h-11"
                />
              </Field>
            </div>
            <Field label={t('fields.website')}>
              <Input
                value={form.website ?? ''}
                onChange={(e) => updateField('website', e.target.value)}
                className="h-11"
                placeholder="https://www.rateq.qa"
              />
            </Field>
          </section>

          <section className="surface-card space-y-4 rounded-2xl border p-5 sm:p-6">
            <h2 className="text-base font-semibold text-primary">{t('sections.social')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('fields.facebookUrl')}>
                <Input
                  value={form.facebookUrl ?? ''}
                  onChange={(e) => updateField('facebookUrl', e.target.value)}
                  className="h-11"
                />
              </Field>
              <Field label={t('fields.twitterUrl')}>
                <Input
                  value={form.twitterUrl ?? ''}
                  onChange={(e) => updateField('twitterUrl', e.target.value)}
                  className="h-11"
                />
              </Field>
              <Field label={t('fields.youtubeUrl')}>
                <Input
                  value={form.youtubeUrl ?? ''}
                  onChange={(e) => updateField('youtubeUrl', e.target.value)}
                  className="h-11"
                />
              </Field>
              <Field label={t('fields.linkedinUrl')}>
                <Input
                  value={form.linkedinUrl ?? ''}
                  onChange={(e) => updateField('linkedinUrl', e.target.value)}
                  className="h-11"
                />
              </Field>
            </div>
          </section>

          <section className="surface-card space-y-4 rounded-2xl border p-5 sm:p-6">
            <h2 className="text-base font-semibold text-primary">{t('sections.about')}</h2>
            <Field label={t('fields.aboutTextEn')}>
              <textarea
                value={form.aboutTextEn ?? ''}
                onChange={(e) => updateField('aboutTextEn', e.target.value)}
                rows={4}
                className="select-field w-full py-2"
              />
            </Field>
            <Field label={t('fields.aboutTextAr')}>
              <textarea
                value={form.aboutTextAr ?? ''}
                onChange={(e) => updateField('aboutTextAr', e.target.value)}
                rows={4}
                dir="rtl"
                className="select-field w-full py-2"
              />
            </Field>
          </section>

          <Button type="submit" disabled={saving} className="min-w-40">
            {saving ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t('saving')}
              </>
            ) : (
              t('save')
            )}
          </Button>
        </form>
      )}
    </DashboardShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink dark:text-white">{label}</label>
      {children}
    </div>
  );
}
