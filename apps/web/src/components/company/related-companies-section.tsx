import { CompanyCard } from '@/components/company/company-card';
import type { CompanyPublic } from '@rateq/types';
import { Link } from '@/i18n/routing';
import { searchMockCompanies } from '@/lib/mock-companies';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { JSX } from 'react';

interface RelatedCompaniesSectionProps {
  company: CompanyPublic;
}

export async function RelatedCompaniesSection({
  company,
}: RelatedCompaniesSectionProps): Promise<JSX.Element> {
  const t = await getTranslations('companyPage');

  const params = new URLSearchParams({
    city: company.city,
    sort: 'rating',
    limit: '4',
  });

  const result = searchMockCompanies(params);
  const related = result.data.filter((item) => item.id !== company.id).slice(0, 3);

  if (related.length === 0) return <></>;

  return (
    <section className="border-t border-slate-100 bg-slate-50/60 py-12 sm:py-16">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-ink">{t('relatedTitle')}</h2>
          <Link
            href={{ pathname: '/search', query: { city: company.city } }}
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-600"
          >
            {t('viewAllInCity', { city: company.city })}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((item) => (
            <CompanyCard key={item.id} company={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
