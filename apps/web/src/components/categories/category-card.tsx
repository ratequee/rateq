'use client';

import { CategoryBilingualName } from '@/components/categories/category-bilingual-name';
import { Link } from '@/i18n/routing';
import { getCategoryLabel } from '@/lib/category-label';
import { getCategoryIcon } from '@/lib/category-icons';
import { cn } from '@/lib/utils';
import type { CategoryPublic } from '@rateq/types';
import { ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface CategoryCardProps {
  category: CategoryPublic;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

export function CategoryCard({ category, variant = 'default', className }: CategoryCardProps) {
  const t = useTranslations('categories');
  const locale = useLocale();
  const label = getCategoryLabel(category, locale);
  const descriptionName = label;
  const Icon = getCategoryIcon(category.slug);
  const href = `/categories/${category.slug}`;
  const count = category.companyCount ?? 0;
  const services = category.services ?? [];

  if (variant === 'compact') {
    return (
      <Link
        href={href}
        className={cn(
          'flex w-[140px] shrink-0 flex-col items-center rounded-2xl border border-subtle bg-white p-5 shadow-sm transition-shadow hover:border-gold-300 hover:shadow-card dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-500 sm:w-[160px]',
          className,
        )}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gold-300 text-white">
          <Icon className="h-9 w-9" aria-hidden />
        </div>
        <CategoryBilingualName
          nameEn={category.nameEn}
          nameAr={category.nameAr}
          className="mt-4 text-center"
          primaryClassName="text-sm font-semibold leading-snug text-primary dark:text-white"
          secondaryClassName="text-xs font-medium text-ink-muted dark:text-white/75"
        />
        <p className="mt-1 text-xs text-ink-muted dark:text-white/85">
          {t('companyCount', { count })}
        </p>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link
        href={href}
        className={cn(
          'group relative overflow-hidden rounded-2xl border border-subtle bg-white p-6 shadow-sm transition-all hover:border-brand-200 hover:shadow-card dark:bg-slate-900 dark:hover:border-brand-800',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-[80px] w-[80px] shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white">
            <Icon className="h-10 w-10" aria-hidden />
          </div>
          <span className="rounded-full bg-gold-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-gold-500/20 dark:text-gold-300">
            {t('popularBadge')}
          </span>
        </div>
        <CategoryBilingualName
          nameEn={category.nameEn}
          nameAr={category.nameAr}
          className="mt-5"
          primaryClassName="text-lg font-semibold text-primary dark:text-white"
          secondaryClassName="text-sm font-medium text-secondary dark:text-white/80"
        />
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-secondary dark:text-white/80">
          {t('categoryDescription', { name: descriptionName })}
        </p>
        <div className="mt-5 flex items-center justify-between border-t border-subtle pt-4 dark:border-slate-700">
          <span className="text-sm text-secondary dark:text-white/80">
            {t('companyCount', { count })}
          </span>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-500 transition-colors group-hover:bg-brand-500 group-hover:text-white dark:bg-slate-700 dark:text-white dark:group-hover:bg-brand-500">
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        'group relative mt-10 flex flex-col rounded-2xl border border-default bg-white px-6 pb-6 pt-14 shadow-sm transition-all hover:border-gold-400 hover:shadow-md dark:bg-slate-900',
        className,
      )}
    >
      <div className="absolute start-1/2 top-0 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl bg-gold-300 text-white transition-colors group-hover:bg-gold-400 rtl:translate-x-1/2">
        <Icon className="h-11 w-11" aria-hidden />
      </div>

      <CategoryBilingualName
        nameEn={category.nameEn}
        nameAr={category.nameAr}
        className="text-center"
        primaryClassName="text-lg font-bold text-primary dark:text-white"
        secondaryClassName="text-sm font-medium text-secondary dark:text-white/80"
      />

      {services.length > 0 ? (
        <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-700">
          {services.map((service) => (
            <li key={service.id} className="py-3 text-sm text-secondary dark:text-white/80">
              {service.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 border-t border-default py-3 text-center text-sm text-secondary dark:text-white/80">
          {t('noServices')}
        </p>
      )}
    </Link>
  );
}
