import { CompanyCard } from '@/components/company/company-card';
import type { CompanyPublic } from '@rateq/types';
import { fetchCompanies } from '@/lib/companies-data';
import { getTranslations } from 'next-intl/server';
import type { JSX } from 'react';
import { FeaturedCompanyCard } from '../home/featured-company-card';

interface RelatedCompaniesSectionProps {
  company: CompanyPublic;
}

export async function RelatedCompaniesSection({
  company,
}: RelatedCompaniesSectionProps): Promise<JSX.Element> {
  const t = await getTranslations('companyPage');

  const params = new URLSearchParams({
    sort: 'rating',
    limit: '4',
  });
  if (company.categoryId) params.set('categoryId', company.categoryId);
  else params.set('city', company.city);

  const result = await fetchCompanies(params);
  const related = result.data.filter((item) => item.id !== company.id).slice(0, 3);
  const rest = result.data.filter((item) => item.id !== company.id).slice(3);

  if (related.length === 0) return <></>;

  return (
    <section className="bg-slate-50 py-12 dark:bg-slate-900/50 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-primary sm:text-3xl">{t('relatedCompanies')}</h2>
          </div>
        </div>

        {related.length === 0 ? (
          <p className="py-16 text-center text-ink-muted">{t('noResults')}</p>
        ) : (
          <>
            {related.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((company) => (
                  <FeaturedCompanyCard key={company.id} company={company} />
                ))}
              </div>
            )}

            {rest.length > 0 && (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
