import { FeaturedCompanyCard } from '@/components/home/featured-company-card';
import { CompanyCard } from '@/components/company/company-card';
import type { CompanyPublic } from '@rateq/types';
import { getTranslations } from 'next-intl/server';
import type { JSX } from 'react';

interface CategoryCompaniesSectionProps {
  companies: CompanyPublic[];
  total: number;
}

export async function CategoryCompaniesSection({
  companies,
  total,
}: CategoryCompaniesSectionProps): Promise<JSX.Element> {
  const t = await getTranslations('categoryPage');
  const tc = await getTranslations('common');

  const featured = companies.slice(0, 3);
  const rest = companies.slice(3);

  return (
    <section className="py-12 dark:bg-slate-950 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-ink dark:text-white sm:text-3xl">
              {t('companiesTitle')}
            </h2>
            <p className="mt-2 text-sm text-ink-muted dark:text-white/85 sm:text-base">
              {t('companiesSubtitle', { count: total })}
            </p>
          </div>
        </div>

        {companies.length === 0 ? (
          <p className="py-16 text-center text-ink-muted dark:text-white/85">{tc('noResults')}</p>
        ) : (
          <>
            {featured.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((company) => (
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
