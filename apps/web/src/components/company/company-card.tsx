'use client';

import type { CompanyPublic } from '@rateq/types';
import { Link } from '@/i18n/routing';
import { Card, CardContent } from '@/components/ui/card';
import { StarRating } from '@/components/ui/star-rating';
import { MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CompanyCardProps {
  company: CompanyPublic;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const t = useTranslations('common');

  return (
    <Link href={`/companies/${company.slug}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">{company.name}</h3>
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                <MapPin className="h-3.5 w-3.5" />
                {company.city}, {company.country}
              </p>
            </div>
            {company.logo ? (
              <img src={company.logo} alt="" className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 font-bold text-brand-500 dark:bg-slate-800 dark:text-brand-300">
                {company.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <StarRating value={company.ratingAverage} size="sm" />
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {company.reviewCount} {t('reviews')}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
