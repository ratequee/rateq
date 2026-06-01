import { Link } from '@/i18n/routing';
import type { CategoryDefinition } from '@/lib/categories';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CategoryCardProps {
  category: CategoryDefinition;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}
const serviceComponent = (services: string[]) => {
  return services.map((service) => (
    <li key={service} className='border-b-2 border-slate-100 pb-2 last:border-b-0'>{service}</li>
  ))
}

export function CategoryCard({ category, variant = 'default', className }: CategoryCardProps) {
  const t = useTranslations('categories');
  const Icon = category.icon;

  const href = `/categories/${category.id}`;

  if (variant === 'compact') {
    return (
      <Link
        href={href}
        className={cn(
          'flex w-[140px] shrink-0 flex-col items-center rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:border-gold-300 hover:shadow-card sm:w-[160px]',
          className,
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gold-300 text-white">
          <Icon className="h-7 w-7" aria-hidden />
        </div>
        <h3 className="mt-4 text-center text-sm font-semibold leading-snug text-ink">
          {t(`items.${category.id}.name`)}
        </h3>
        <p className="mt-1 text-xs text-ink-muted">
          {t('companyCount', { count: category.count })}
        </p>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link
        href={href}
        className={cn(
          'group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-brand-200 hover:shadow-card',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white">
            <Icon className="h-8 w-8" aria-hidden />
          </div>
          <span className="rounded-full bg-gold-50 px-3 py-1 text-xs font-medium text-brand-600">
            {t('popularBadge')}
          </span>
        </div>
        <h3 className="mt-5 text-lg font-semibold text-ink">{t(`items.${category.id}.name`)}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">
          {t(`items.${category.id}.description`)}
        </p>
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-sm text-ink-muted">
            {t('companyCount', { count: category.count })}
          </span>
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
        'group flex flex-col mt-20 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-gold-500 hover:shadow-card sm:p-8',
        className,
      )}
    >
      <div className="flex flex-col items-center">
      <div className="flex h-[100px] w-[100px] mt-[-50px] items-center justify-center rounded-lg bg-gold-300 text-white transition-colors group-hover:bg-gold-500 group-hover:text-white">
        <Icon className="h-10 w-10" aria-hidden />
      </div>
      </div>
      <h3 className="mt-5 text-center text-sm font-semibold leading-snug text-ink sm:text-base">
        {t(`items.${category.id}.name`)}
      </h3>
      <p className="mt-2 text-center text-xs text-ink-muted sm:text-sm">
        {t('companyCount', { count: category.count })}
      </p>
      <ul className="mt-8 text-xs text-ink-muted sm:text-sm">
        {serviceComponent(["Service 01", "Service 02", "Service 03", "Service 04", "Service 05", "Service 06"])}
      </ul>
    </Link>
  );
}
