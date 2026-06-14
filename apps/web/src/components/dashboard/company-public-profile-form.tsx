'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/components/providers/profile-provider';
import { onboardingApi } from '@/lib/onboarding-api';
import { ApiError } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function CompanyPublicProfileForm() {
  const t = useTranslations('profilePage');
  const { onboarding, refreshOnboarding } = useProfile();
  const company = onboarding?.company;

  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [services, setServices] = useState<string[]>(['']);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!company) return;
    setDescription(company.description ?? '');
    setWebsiteUrl(company.websiteUrl ?? '');
    setServices(company.services?.length ? company.services : ['']);
  }, [company]);

  const updateService = (index: number, value: string) => {
    setServices((current) => current.map((item, i) => (i === index ? value : item)));
  };

  const addService = () => {
    setServices((current) => (current.length >= 20 ? current : [...current, '']));
  };

  const removeService = (index: number) => {
    setServices((current) => {
      const next = current.filter((_, i) => i !== index);
      return next.length ? next : [''];
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!company) return;

    setSubmitting(true);
    try {
      const token = await ensureValidAccessToken();
      if (!token) throw new Error(t('sessionExpired'));

      const normalizedServices = services.map((service) => service.trim()).filter(Boolean);

      await onboardingApi.updateCompany({
        description: description.trim() || undefined,
        websiteUrl: websiteUrl.trim() || null,
        services: normalizedServices,
      });

      await refreshOnboarding();
      toast.success(t('publicProfileUpdated'));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('saveError');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!company) return null;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-ink">{t('publicProfileTitle')}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t('publicProfileSubtitle')}</p>
      </div>

      <Field label={t('companyAbout')} hint={t('companyAboutHint')}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          maxLength={5000}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
          placeholder={t('companyAboutPlaceholder')}
        />
      </Field>

      <Field label={t('websiteUrl')} hint={t('websiteUrlHint')}>
        <Input
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://example.com"
          className="h-11"
        />
      </Field>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink">{t('companyServices')}</p>
            <p className="text-xs text-ink-muted">{t('companyServicesHint')}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addService}>
            <Plus className="h-4 w-4" />
            {t('addService')}
          </Button>
        </div>
        <div className="space-y-2">
          {services.map((service, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={service}
                onChange={(e) => updateService(index, e.target.value)}
                placeholder={t('servicePlaceholder')}
                className="h-10"
                maxLength={100}
              />
              <Button
                type="button"
                variant="ghost"
                className="h-10 w-10 shrink-0 px-0"
                onClick={() => removeService(index)}
                aria-label={t('removeService')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? t('saving') : t('savePublicProfile')}
      </Button>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      {hint ? <p className="mb-2 text-xs text-ink-muted">{hint}</p> : null}
      {children}
    </div>
  );
}
