import { getCompanyServices } from '@/lib/company-services-data';
import { getTranslations } from 'next-intl/server';
import type { JSX } from 'react';

interface CompanyServicesSectionProps {
  companyId: string;
  categoryName?: string | null;
}

export async function CompanyServicesSection({
  companyId,
  categoryName,
}: CompanyServicesSectionProps): Promise<JSX.Element> {
  const t = await getTranslations('companyPage');
  const services = getCompanyServices(companyId, categoryName);

  if (services.length === 0) return <></>;

  return (
    <section className="mt-6">
      <h2 className="text-lg font-bold text-ink sm:text-xl">{t('servicesTitle')}</h2>
      <ul className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-[#F3F3F3]">
        {services.map((service, index) => (
          <li
            key={service}
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
