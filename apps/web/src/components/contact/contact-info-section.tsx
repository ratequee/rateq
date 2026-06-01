import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { JSX } from 'react';

export async function ContactInfoSection(): Promise<JSX.Element> {
  const t = await getTranslations('contact');
  const tf = await getTranslations('footer');

  const items = [
    {
      icon: MapPin,
      title: tf('ourAddress'),
      lines: [tf('address')],
    },
    {
      icon: Phone,
      title: tf('phone'),
      lines: [tf('phone')],
      href: 'tel:+97400000000',
    },
    {
      icon: Mail,
      title: tf('email'),
      lines: [tf('email')],
      href: 'mailto:support@rateq.com',
    },
    {
      icon: Clock,
      title: t('hoursTitle'),
      lines: [t('hoursWeekdays'), t('hoursWeekend')],
    },
  ];

  return (
    <div className="space-y-4">
      {items.map(({ icon: Icon, title, lines, href }) => (
        <div
          key={title}
          className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
            <Icon className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h3 className="font-semibold text-ink">{title}</h3>
            {lines.map((line) =>
              href ? (
                <a
                  key={line}
                  href={href}
                  className="mt-1 block text-sm text-brand-500 hover:underline"
                >
                  {line}
                </a>
              ) : (
                <p key={line} className="mt-1 text-sm text-ink-muted">
                  {line}
                </p>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
