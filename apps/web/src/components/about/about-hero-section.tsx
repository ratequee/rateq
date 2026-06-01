import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/breadcrumbs';
import { getTranslations } from 'next-intl/server';
import type { JSX } from 'react';

export async function AboutHeroSection(): Promise<JSX.Element> {
  const t = await getTranslations('about');
  const breadcrumbs = t.raw('breadcrumbs') as BreadcrumbItem[];

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-white via-white to-slate-50/80 pb-12 pt-6 sm:pb-20 sm:pt-8 lg:pb-24"
      style={{
        backgroundImage: 'url(/images/herobg.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="flex justify-between items-center flex-wrap gap-4 mx-auto max-w-page px-4 sm:px-6 lg:px-8">

        <div className="max-w-3xl">
          <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl md:text-5xl md:leading-[1.1]">
            {t('titlePrefix')}{' '}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">{t('subtitle')}</p>
        </div>
        <Breadcrumbs items={breadcrumbs} ariaLabel={t('breadcrumbAria')} />
      </div>
    </section>
  );
}
