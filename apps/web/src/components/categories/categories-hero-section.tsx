import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getLocale, getTranslations } from 'next-intl/server';
import type { JSX } from 'react';
import { BreadcrumbItem, Breadcrumbs } from '../ui/breadcrumbs';
import Image from 'next/image';

export async function CategoriesHeroSection(): Promise<JSX.Element> {
  const locale = await getLocale();
  const t = await getTranslations('categories');
  const breadcrumbs = t.raw('breadcrumbs') as BreadcrumbItem[];

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-white via-brand-50/30 to-white py-12 dark:from-dm-bg dark:via-dm-bg dark:to-dm-bg sm:py-16 lg:py-20"
      style={{
        backgroundImage: 'url(/images/herobg.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 hidden bg-dm-bg/80 dark:block"
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-page flex-row flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div>
          <div className="mx-auto max-w-3xl text-center md:text-start">
            <h1 className="mt-3 text-balance text-3xl font-bold text-ink dark:text-white sm:text-4xl lg:text-5xl">
              {t('titlePrefix')}{' '}
            </h1>
          </div>

          <form action={`/${locale}/categories`} className="mx-auto mt-8 max-w-xl md:mx-0">
            <div className="relative flex items-center rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-white/25 dark:bg-dm-bg/90 dark:focus-within:border-white/40 dark:focus-within:ring-white/10">
              <Input
                name="q"
                placeholder={t('searchPlaceholder')}
                className="h-14 flex-1 border-0 bg-transparent ps-5 text-base text-ink shadow-none focus-visible:ring-0 dark:text-white dark:placeholder:text-white/60"
              />
              <Button
                type="submit"
                size="lg"
                variant="ghost"
                className="me-2 h-11 shrink-0 rounded-lg bg-transparent px-5 dark:bg-white dark:hover:bg-white/90"
                aria-label={t('searchPlaceholder')}
              >
                <Image
                  src="/images/search.svg"
                  alt="Search"
                  width={20}
                  height={20}
                  className="h-5 w-5"
                />
              </Button>
            </div>
          </form>
        </div>
        <Breadcrumbs items={breadcrumbs} ariaLabel={t('breadcrumbAria')} />
      </div>
    </section>
  );
}
