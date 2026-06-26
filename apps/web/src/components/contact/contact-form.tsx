'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QatarPhoneInput } from '@/components/ui/qatar-phone-input';
import { contactApi, ApiError } from '@/lib/api';
import {
  formatQatarPhoneForSubmit,
  validateContactFields,
  type ContactFieldErrors,
} from '@/lib/validation/contact-fields';
import type { ContactSubject } from '@rateq/types';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

const SUBJECT_OPTIONS: ContactSubject[] = ['general', 'support', 'business', 'partnership'];

export function ContactForm() {
  const t = useTranslations('contact');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState<ContactSubject | ''>('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});

  const subjectLabels: Record<ContactSubject, string> = {
    general: t('subjectGeneral'),
    support: t('subjectSupport'),
    business: t('subjectBusiness'),
    partnership: t('subjectPartnership'),
  };

  const validationMessages = {
    name: {
      required: t('validation.nameRequired'),
      invalid: t('validation.nameInvalid'),
      min: t('validation.nameMin'),
      max: t('validation.nameMax'),
    },
    email: {
      required: t('validation.emailRequired'),
      invalid: t('validation.emailInvalid'),
    },
    phone: {
      required: t('validation.phoneRequired'),
      invalid: t('validation.phoneInvalid'),
    },
    subject: {
      required: t('validation.subjectRequired'),
      invalid: t('validation.subjectInvalid'),
    },
    message: {
      required: t('validation.messageRequired'),
      min: t('validation.messageMin'),
      max: t('validation.messageMax'),
    },
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = {
      name,
      email,
      phone: formatQatarPhoneForSubmit(phone),
      subject: subject as ContactSubject,
      message,
    };

    const errors = validateContactFields(payload, validationMessages);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await contactApi.submit(payload);
      toast.success(t('successMessage'));
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (error) {
      const messageText = error instanceof ApiError ? error.message : t('errorMessage');
      toast.error(messageText);
    } finally {
      setLoading(false);
    }
  };

  const fieldClassName = (field: keyof ContactFieldErrors) =>
    cn(fieldErrors[field] && 'border-red-400 focus-visible:ring-red-400');

  return (
    <div>
      <h2 className="text-xl font-bold text-ink dark:text-white sm:text-2xl">{t('formTitle')}</h2>
      <p className="mt-2 text-sm text-ink-muted dark:text-white/90 sm:text-base">
        {t('formSubtitle')}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-10" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-ink dark:text-white"
            >
              {t('nameLabel')}
            </label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('namePlaceholder')}
              aria-invalid={Boolean(fieldErrors.name)}
              className={fieldClassName('name')}
            />
            {fieldErrors.name ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
            ) : null}
          </div>
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-ink dark:text-white"
            >
              {t('emailLabel')}
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('emailPlaceholder')}
              aria-invalid={Boolean(fieldErrors.email)}
              className={fieldClassName('email')}
            />
            {fieldErrors.email ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            ) : null}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="phone"
              className="mb-1.5 block text-sm font-medium text-ink dark:text-white"
            >
              {t('phoneLabel')}
            </label>
            <QatarPhoneInput
              id="phone"
              name="phone"
              value={phone}
              onChange={setPhone}
              placeholder={t('phonePlaceholder')}
              aria-invalid={Boolean(fieldErrors.phone)}
            />
            {fieldErrors.phone ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
            ) : null}
          </div>
          <div>
            <label
              htmlFor="subject"
              className="mb-1.5 block text-sm font-medium text-ink dark:text-white"
            >
              {t('subjectLabel')}
            </label>
            <select
              id="subject"
              name="subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value as ContactSubject | '')}
              aria-invalid={Boolean(fieldErrors.subject)}
              className={cn(
                'select-field focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:focus-visible:ring-brand-400',
                fieldClassName('subject'),
              )}
            >
              <option value="">{t('subjectPlaceholder')}</option>
              {SUBJECT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {subjectLabels[option]}
                </option>
              ))}
            </select>
            {fieldErrors.subject ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.subject}</p>
            ) : null}
          </div>
        </div>
        <div>
          <label
            htmlFor="message"
            className="mb-1.5 block text-sm font-medium text-ink dark:text-white"
          >
            {t('messageLabel')}
          </label>
          <textarea
            id="message"
            name="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={5}
            placeholder={t('messagePlaceholder')}
            aria-invalid={Boolean(fieldErrors.message)}
            className={cn(
              'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-dm-border dark:bg-dm-surface dark:text-white dark:placeholder:text-slate-500 dark:focus-visible:ring-brand-400',
              fieldClassName('message'),
            )}
          />
          {fieldErrors.message ? (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.message}</p>
          ) : null}
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="w-full bg-gold-500 font-bold text-black hover:bg-gold-600 sm:w-full"
        >
          {loading ? t('sending') : t('submit')}
        </Button>
      </form>
    </div>
  );
}
