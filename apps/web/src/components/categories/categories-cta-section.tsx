import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import type { JSX } from 'react';

export async function CategoriesCtaSection(): Promise<JSX.Element> {
  const t = await getTranslations('categories');

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl bg-gold-300 px-6 py-10 sm:px-10 sm:py-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-brand-800 sm:text-3xl">{t('ctaTitle')}</h2>
            <p className="mt-3 text-base text-brand-700/90 sm:text-lg">{t('ctaSubtitle')}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/register">
                <Button size="lg" className="bg-brand-700 hover:bg-brand-800">
                  {t('ctaPrimary')}
                </Button>
              </Link>
              <Link href="/search">
                <Button variant="outline-brand" size="lg" className="border-brand-700 bg-transparent">
                  {t('ctaSecondary')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
