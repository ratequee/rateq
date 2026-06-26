'use client';

import { homeDarkBorder, homeDarkCard } from '@/components/home/home-dark-surfaces';

import type { CompanyPublic } from '@rateq/types';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { getLocalizedCategoryName } from '@/lib/category-label';
import { Link } from '@/i18n/routing';
import { ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface FeaturedCompanyCardProps {
  company: CompanyPublic;
}

export function FeaturedCompanyCard({ company }: FeaturedCompanyCardProps) {
  const t = useTranslations('home');
  const locale = useLocale();
  const categoryLabel = getLocalizedCategoryName(company, locale);

  const badges = [t('badgeVerifiedLabel'), categoryLabel].filter((label): label is string =>
    Boolean(label),
  );

  return (
    <Link
      href={`/companies/${company.slug}`}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-subtle bg-white shadow-sm transition-shadow hover:shadow-card',
        homeDarkCard,
      )}
      aria-label={t('viewCompany', { name: company.name })}
    >
      <div className="relative h-44 shrink-0 overflow-hidden sm:h-48">
        {company.coverUrl ? (
          <>
            <img
              src={company.coverUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/25" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/90 to-brand-700" />
        )}
        {badges.length > 0 && (
          <div className="absolute start-4 top-4 z-10 flex flex-wrap gap-2">
            {badges.map((badge, index) => (
              <Badge
                key={`${index}-${badge}`}
                className={cn(
                  'rounded-sm border-0 bg-gold-300 text-xs font-medium text-white',
                  index === 0 && 'bg-gold-500',
                  index === 1 && 'bg-white text-brand-500',
                )}
              >
                {badge}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3">
          {company.logo ? (
            <img
              src={company.logo}
              alt=""
              className="relative z-10 mt-[-50px] h-[72px] w-[72px] shrink-0 rounded-2xl border-4 border-white bg-white object-cover shadow-md sm:h-20 sm:w-20"
            />
          ) : (
            <div className="relative z-10 mt-[-50px] flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-brand-100 text-xl font-bold text-brand-500 shadow-md sm:h-20 sm:w-20">
              {company.name.charAt(0)}
            </div>
          )}
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-ink transition-colors group-hover:text-brand-500 dark:text-white dark:group-hover:text-white/90">
              {company.name}
            </h3>
            <p className="mt-0.5 text-sm text-ink-muted dark:text-white/85">
              {company.city}, {company.country}
            </p>
          </div>
        </div>
        <div className={cn('mt-4 border-t-2 border-slate-100 pt-4', homeDarkBorder)}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-ink dark:text-white">
                {company.ratingAverage.toFixed(1)}
              </span>
              <StarRating value={company.ratingAverage} size="sm" />
            </div>
            <span className="text-xs text-ink-muted dark:text-white/85 sm:text-sm">
              ({company.reviewCount.toLocaleString()} {t('reviewsLabel')})
            </span>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gold-300 text-white transition-colors group-hover:bg-gold-600">
              <ArrowRight className="h-5 w-5 rtl:rotate-180" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
