'use client';

import { Link } from '@/i18n/routing';
import { getCategoryIcon } from '@/lib/category-icons';
import { cn } from '@/lib/utils';
import type { CategoryPublic } from '@rateq/types';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CategoryCardProps {
  category: CategoryPublic;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

export function CategoryCard({ category, variant = 'default', className }: CategoryCardProps) {
  const t = useTranslations('categories');
  const Icon = getCategoryIcon(category.slug);
  const href = `/categories/${category.slug}`;
  const count = category.companyCount ?? 0;
  const services = category.services ?? [];

  if (variant === 'compact') {
    return (
      <Link
        href={href}
        className={cn(
          'flex w-[140px] shrink-0 flex-col items-center rounded-2xl border border-subtle bg-white p-5 shadow-sm transition-shadow hover:border-gold-300 hover:shadow-card dark:bg-slate-900 sm:w-[160px]',
          className,
        )}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gold-300 text-white">
          <Icon className="h-9 w-9" aria-hidden />
        </div>
        <h3 className="mt-4 text-center text-sm font-semibold leading-snug text-primary">
          {category.name}
        </h3>
        <p className="mt-1 text-xs text-ink-muted">{t('companyCount', { count })}</p>
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
          <span className="rounded-full bg-gold-50 px-3 py-1 text-xs font-medium text-brand-600">
            {t('popularBadge')}
          </span>
        </div>
        <h3 className="mt-5 text-lg font-semibold text-primary">{category.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-secondary">
          {t('categoryDescription', { name: category.name })}
        </p>
        <div className="mt-5 flex items-center justify-between border-t border-subtle pt-4">
          <span className="text-sm text-secondary">{t('companyCount', { count })}</span>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-500 transition-colors group-hover:bg-brand-500 group-hover:text-white">
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

      <h3 className="text-center text-lg font-bold text-primary">{category.name}</h3>

      {services.length > 0 ? (
        <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-700">
          {services.map((service) => (
            <li key={service.id} className="py-3 text-sm text-secondary">
              {service.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 border-t border-default py-3 text-center text-sm text-secondary">
          {t('noServices')}
        </p>
      )}
    </Link>
  );
}
