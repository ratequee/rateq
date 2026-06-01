import type { CompanyPublic } from '@rateq/types';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { Globe, Mail, MapPin, Phone } from 'lucide-react';
import type { JSX } from 'react';

interface CompanyInfoPanelProps {
  company: CompanyPublic;
}

export async function CompanyInfoPanel({ company }: CompanyInfoPanelProps): Promise<JSX.Element> {
  const t = await getTranslations('companyPage');

  const items = [
    {
      icon: MapPin,
      label: t('location'),
      value: `${company.city}, ${company.country}`,
    },
    {
      icon: Globe,
      label: t('website'),
      value: `www.${company.slug}.qa`,
      href: '#',
    },
    {
      icon: Phone,
      label: t('phone'),
      value: '+974 0000 0000',
      href: 'tel:+97400000000',
    },
    {
      icon: Mail,
      label: t('email'),
      value: `contact@${company.slug}.com`,
      href: `mailto:contact@${company.slug}.com`,
    },
  ];

  return (
    <aside className="space-y-5">
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-ink">{t('companyInfo')}</h2>
        <ul className="mt-4 space-y-4">
          {items.map(({ icon: Icon, label, value, href }) => (
            <li key={label} className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-light">{label}</p>
                {href ? (
                  <a href={href} className="mt-0.5 block truncate text-sm text-brand-500 hover:underline">
                    {value}
                  </a>
                ) : (
                  <p className="mt-0.5 text-sm text-ink">{value}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl bg-brand-500 p-5 text-white sm:p-6">
        <h3 className="font-semibold">{t('trustTitle')}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/85">{t('trustDescription')}</p>
        <Link href="/categories" className="mt-4 inline-block">
          <Button variant="gold" size="sm">
            {t('browseCategory')}
          </Button>
        </Link>
      </div>
    </aside>
  );
}
