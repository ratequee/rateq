import { getTranslations } from 'next-intl/server';
import type { JSX } from 'react';

interface CompanyServicesSectionProps {
  services: string[];
}

export async function CompanyServicesSection({
  services,
}: CompanyServicesSectionProps): Promise<JSX.Element | null> {
  const t = await getTranslations('companyPage');

  if (services.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="text-lg font-bold text-ink sm:text-xl">{t('servicesTitle')}</h2>
      <ul className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-[#F3F3F3]">
        {services.map((service, index) => (
          <li
            key={`${service}-${index}`}
            className={`px-5 py-4 text-sm font-medium text-ink sm:text-base ${
              index < services.length - 1 ? 'border-b border-slate-200' : ''
            }`}
          >
            {service}
          </li>
        ))}
      </ul>
    </section>
  );
}
