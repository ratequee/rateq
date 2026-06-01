'use client';

import type { CompanyPublic } from '@rateq/types';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { Link } from '@/i18n/routing';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface FeaturedCompanyCardProps {
  company: CompanyPublic;
}

export function FeaturedCompanyCard({ company }: FeaturedCompanyCardProps) {
  const t = useTranslations('home');

  const badges = [
    t('badgeVerifiedLabel'),
    company.categoryId ? t(`categoryBadge.${company.categoryId}`) : null,
  ].filter((label): label is string => Boolean(label));

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-card">
      <div className="relative h-44 shrink-0 bg-gradient-to-br from-brand-500/90 to-brand-700 sm:h-48">
        {company.logo ? (
          <img
            src={company.logo}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-90"
          />
        ) : null}
        {badges.length > 0 && (
          <div className="absolute start-4 top-4 z-10 flex flex-wrap gap-2">
            {badges.map((badge, index) => (
              <Badge
                key={`${index}-${badge}`}
                className={cn(
                  'border-0 rounded-sm bg-gold-300 text-xs font-medium text-white',
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
        <Image src={"/images/company_avatar.svg"} alt={company.name} width={120} height={120} className='mt-[-50px] z-10 relative' />
        <div className="flex flex-col">
        <h3 className="text-lg font-semibold text-ink">{company.name}</h3>
        <p className="mt-0.5 text-sm text-ink-muted">
          {company.city}, {company.country}
        </p>
        </div>
        </div>
        <div className="mt-4 border-t-2 border-slate-100 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-ink">
                {company.ratingAverage.toFixed(1)}
              </span>
              <StarRating value={company.ratingAverage} size="sm" />
            </div>
            <span className="text-xs text-ink-muted sm:text-sm">
              ({company.reviewCount.toLocaleString()} {t('reviewsLabel')})
            </span>
          <Link
            href={`/companies/${company.slug}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gold-300 text-white transition-colors hover:bg-gold-600"
            aria-label={t('viewCompany', { name: company.name })}
          >
            <ArrowRight className="h-5 w-5 rtl:rotate-180" />
          </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
