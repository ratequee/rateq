import { Mail, Phone } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { JSX } from 'react';

export async function ContactInfoSection(): Promise<JSX.Element> {
  const t = await getTranslations('contact');

  const infoItem = {
    title: t('infoTitle'),
    line: t('infoLine'),
  };
  const phoneItem = {
    title: t('phoneLabel'),
    line: t('phonePlaceholder'),
    href: 'tel:+97400000000',
  };
  const emailItem = {
    title: t('emailLabel'),
    line: t('emailPlaceholder'),
    href: 'mailto:support@rateq.com',
  };

  return (
    <div className="space-y-4 bg-brand-500 p-4 rounded-2xl">
        <div>
          <div
            className="flex gap-4 rounded-2xl bg-brand-400/20 p-5 shadow-sm"
          >
            <div>
              <h3 className="font-bold text-white text-xl">{infoItem.title}</h3>
              <p className="mt-1 text-sm text-white">
                {infoItem.line}
              </p>
            </div>
          </div>
          <div
            className="flex gap-4 p-4 shadow-sm"
          >
            <a href={emailItem.href}>
            <Mail className="h-8 w-8 text-white" />
            </a>
            <div>
              <h3 className="font-regular text-white text-sm">{emailItem.title}</h3>
              <p className="mt-1 text-lg text-white font-bold">
                {emailItem.line}
              </p>
            </div>
          </div>
          <div
            className="flex gap-4 px-5 shadow-sm"
          >
            <a href={phoneItem.href}>
            <Phone className="h-8 w-8 text-white" />
            </a>
            <div>
              <h3 className="font-regular text-white text-sm">{phoneItem.title}</h3>
              <p className="mt-1 text-lg text-white font-bold">
                {phoneItem.line}
              </p>
            </div>
          </div>
          <div>
            <p className="text-white text-lg font-bold my-4 ml-2">
              {t('mapTitle')}
            </p>
            <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d14431.08826928405!2d51.546554699999994!3d25.278251899999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sqa!4v1780357291197!5m2!1sen!2sqa" width="100%" height="170" style={{ border: 0, borderRadius: 10 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
          </div>
        </div>
    </div>
  );
}
