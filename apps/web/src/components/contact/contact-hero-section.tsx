import { getTranslations } from 'next-intl/server';
import type { JSX } from 'react';

export async function ContactHeroSection(): Promise<JSX.Element> {
  const t = await getTranslations('contact');

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-brand-50/30 to-white py-14 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-page px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-medium uppercase tracking-wider text-brand-500">{t('eyebrow')}</p>
        <h1 className="mx-auto mt-3 max-w-3xl text-balance text-3xl font-bold text-ink sm:text-4xl lg:text-5xl">
          {t('titlePrefix')}{' '}
          <span className="uppercase text-gold-300">{t('titleHighlight')}</span>{' '}
          {t('titleSuffix')}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
          {t('subtitle')}
        </p>
      </div>
    </section>
  );
}
