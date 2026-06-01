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
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-brand-50/30 to-white py-12 sm:py-16 lg:py-20" style={{backgroundImage: 'url(/images/herobg.svg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat'}}>
      <div className="mx-auto max-w-page flex flex-row flex-wrap gap-4 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div>
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mt-3 text-balance text-3xl font-bold text-ink sm:text-4xl lg:text-5xl">
            {t('titlePrefix')}{' '}
          </h1>
        </div>

        <form action={`/${locale}/categories`} className="mx-auto mt-8 max-w-xl">
          <div className="relative flex items-center rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
            <Input
              name="q"
              placeholder={t('searchPlaceholder')}
              className="h-14 flex-1 border-0 bg-transparent ps-5 text-base shadow-none focus-visible:ring-0"
            />
            <Button
              type="submit"
              size="lg"
              variant={"ghost"}
              className="me-2 h-11 shrink-0 rounded-lg px-5"
              aria-label={t('searchPlaceholder')}
            >
              <Image src="/images/search.svg" alt="Search" width={20} height={20} className="h-5 w-5" />
            </Button>
          </div>
        </form>
        </div>
        <Breadcrumbs items={breadcrumbs} ariaLabel={t('breadcrumbAria')} />
      </div>
    </section>
  );
}
