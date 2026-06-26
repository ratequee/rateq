'use client';

import { darkBorder, darkCard } from '@/lib/dark-surfaces';
import { cn } from '@/lib/utils';

import type { NearbyCompany } from '@/lib/nearby-locations';
import { formatDistanceMeters } from '@/lib/nearby-locations';
import { Link } from '@/i18n/routing';
import { ArrowRight, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface NearbyCompanyListCardProps {
  company: NearbyCompany;
}

export function NearbyCompanyListCard({ company }: NearbyCompanyListCardProps) {
  const t = useTranslations('home');

  const distance = formatDistanceMeters(
    company.distanceMeters,
    (value) => t('nearbyMetersAway', { distance: value }),
    (value) => t('nearbyKmAway', { distance: value }),
  );

  return (
    <article className={cn('rounded-2xl border border-slate-200 bg-white p-4 shadow-sm', darkCard)}>
      <div className="flex items-center gap-3">
        {company.logo ? (
          <img src={company.logo} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-sm font-bold text-brand-600">
            {company.name.charAt(0)}
          </div>
        )}

        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-ink dark:text-white sm:text-base">
          {company.name}
        </h3>

        <Link
          href={`/companies/${company.slug}`}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-600"
          aria-label={t('viewCompany', { name: company.name })}
        >
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </Link>
      </div>

      <div
        className={cn(
          'mt-3 flex items-center gap-3 border-t border-slate-100 pt-3 text-sm',
          darkBorder,
        )}
      >
        <div className="flex items-center gap-1.5">
          <Star className="h-4 w-4 fill-gold-400 text-gold-400" aria-hidden />
          <span className="font-bold text-ink dark:text-white">
            {company.ratingAverage.toFixed(1)}
          </span>
        </div>
        <span className="h-4 w-px bg-slate-200 dark:bg-dm-border" aria-hidden />
        <span className="truncate text-ink-muted dark:text-white/85">{distance}</span>
      </div>
    </article>
  );
}
