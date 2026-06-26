import { getTranslations } from 'next-intl/server';
import type { JSX } from 'react';
import { type BreadcrumbItem, Breadcrumbs } from '../ui/breadcrumbs';

export async function ContactHeroSection(): Promise<JSX.Element> {
  const t = await getTranslations('contact');
  const breadcrumbs = t.raw('breadcrumbs') as BreadcrumbItem[];

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-white via-brand-50/30 to-white py-14 dark:from-dm-bg dark:via-dm-bg dark:to-dm-bg sm:py-10 lg:py-14"
      style={{
        backgroundImage: 'url(/images/herobg.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 hidden bg-dm-bg/80 dark:block"
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-page flex-wrap items-center justify-between gap-4 px-4 text-center sm:px-6 lg:px-8">
        <div className="flex flex-col items-start">
          <h1 className="mt-3 max-w-3xl text-balance text-3xl font-bold text-ink dark:text-white sm:text-4xl lg:text-5xl">
            {t('metaTitle')}{' '}
          </h1>
          <p className="mt-5 max-w-2xl text-left leading-relaxed text-ink-muted dark:text-white/90 sm:text-lg">
            {t('subtitle')}
          </p>
        </div>
        <Breadcrumbs items={breadcrumbs} ariaLabel={t('breadcrumbAria')} />
      </div>
    </section>
  );
}
