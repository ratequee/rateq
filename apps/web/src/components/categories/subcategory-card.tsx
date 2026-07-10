'use client';

import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import type { CategorySubcategoryPublic } from '@rateq/types';
import { ArrowRight, Layers } from 'lucide-react';
import { useLocale } from 'next-intl';

interface SubcategoryCardProps {
  categorySlug: string;
  subcategory: CategorySubcategoryPublic;
  className?: string;
}

export function SubcategoryCard({ categorySlug, subcategory, className }: SubcategoryCardProps) {
  const locale = useLocale();
  const primary = locale === 'ar' ? subcategory.nameAr : subcategory.nameEn;
  const secondary = locale === 'ar' ? subcategory.nameEn : subcategory.nameAr;

  return (
    <Link
      href={`/categories/${categorySlug}?subcategoryId=${subcategory.id}`}
      className={cn(
        'group relative flex min-h-[160px] flex-col overflow-hidden rounded-3xl border border-subtle bg-gradient-to-br from-white via-slate-50 to-brand-50/30 p-5 shadow-sm transition-transform duration-300 ease-out hover:z-10 hover:scale-105 hover:border-brand-300 hover:shadow-lg focus-visible:scale-105 dark:border-dm-border dark:from-dm-elevated dark:via-dm-surface dark:to-dm-elevated dark:hover:border-brand-500 sm:min-h-[180px]',
        className,
      )}
    >
      <div className="flex flex-1 flex-col">
        <p className="text-base font-bold text-primary transition-colors group-hover:text-brand-500 dark:text-white">
          {primary}
        </p>
        {secondary ? (
          <p
            className="mt-1 text-sm font-medium text-secondary dark:text-white/75"
            dir={locale === 'ar' ? 'ltr' : 'rtl'}
          >
            {secondary}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 transition-colors group-hover:bg-brand-500 group-hover:text-white dark:bg-brand-500/20">
          <Layers className="h-7 w-7" aria-hidden />
        </div>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand-500 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-dm-hover dark:text-white">
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </span>
      </div>
    </Link>
  );
}
