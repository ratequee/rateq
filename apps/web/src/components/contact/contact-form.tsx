'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

export function ContactForm() {
  const t = useTranslations('contact');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    toast.success(t('successMessage'));
    e.currentTarget.reset();
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-ink sm:text-2xl">{t('formTitle')}</h2>
      <p className="mt-2 text-sm text-ink-muted sm:text-base">{t('formSubtitle')}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-10">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
              {t('nameLabel')}
            </label>
            <Input id="name" name="name" required minLength={2} placeholder={t('namePlaceholder')} />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
              {t('emailLabel')}
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder={t('emailPlaceholder')}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-ink">
            {t('phoneLabel')}
          </label>
          <Input id="phone" name="phone" required minLength={2} placeholder={t('phonePlaceholder')} />
        </div>
        <div>
          <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-ink">
            {t('subjectLabel')}
          </label>
          <select
            id="subject"
            name="subject"
            required
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <option value="">{t('subjectPlaceholder')}</option>
            <option value="general">{t('subjectGeneral')}</option>
            <option value="support">{t('subjectSupport')}</option>
            <option value="business">{t('subjectBusiness')}</option>
            <option value="partnership">{t('subjectPartnership')}</option>
          </select>
        </div>
        </div>
        <div>
          <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-ink">
            {t('messageLabel')}
          </label>
          <textarea
            id="message"
            name="message"
            required
            minLength={20}
            rows={5}
            placeholder={t('messagePlaceholder')}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          />
        </div>

        <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-full bg-gold-500 text-white hover:bg-gold-600">
          {loading ? t('sending') : t('submit')}
        </Button>
      </form>
    </div>
  );
}
