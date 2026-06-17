import { getTranslations } from 'next-intl/server';
import type { JSX } from 'react';
import { type BreadcrumbItem, Breadcrumbs } from '../ui/breadcrumbs';

export async function ContactHeroSection(): Promise<JSX.Element> {
  const t = await getTranslations('contact');
  const breadcrumbs = t.raw('breadcrumbs') as BreadcrumbItem[];

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-white via-brand-50/30 to-white py-14 sm:py-10 lg:py-14"
      style={{
        backgroundImage: 'url(/images/herobg.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="mx-auto max-w-page flex items-center justify-between gap-4 flex-wrap px-4 text-center sm:px-6 lg:px-8">
        <div className="flex flex-col items-start">
          <h1 className="mt-3 max-w-3xl text-balance text-3xl font-bold text-ink sm:text-4xl lg:text-5xl">
            {t('metaTitle')}{' '}
          </h1>
          <p className="mt-5 max-w-2xl text-left leading-relaxed text-ink-muted sm:text-lg">
            {t('subtitle')}
          </p>
        </div>
        <Breadcrumbs items={breadcrumbs} ariaLabel={t('breadcrumbAria')} />
      </div>
    </section>
  );
}
