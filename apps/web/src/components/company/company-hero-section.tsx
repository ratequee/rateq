import type { CompanyPublic } from '@rateq/types';
import { CompanyBreadcrumb } from '@/components/company/company-breadcrumb';
import type { JSX } from 'react';

interface CompanyHeroSectionProps {
  company: CompanyPublic;
}

export async function CompanyHeroSection({
  company,
}: CompanyHeroSectionProps): Promise<JSX.Element> {
  return (
    <section
      className="bg-slate-50/60 py-10 sm:py-20 dark:bg-slate-900/80"
      style={{
        backgroundImage: 'url(/images/herobg.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary sm:text-3xl lg:text-4xl">
              {company.name}
            </h1>
            {company.description && (
              <p className="mt-6 max-w-3xl text-sm leading-relaxed text-secondary sm:text-base">
                {company.description}
              </p>
            )}
          </div>
          <CompanyBreadcrumb companyName={company.name} />
        </div>
      </div>
    </section>
  );
}
