'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface AdminCompanyMetricsProps {
  reviewCount: number;
  pageVisitCount: number;
  className?: string;
  size?: 'sm' | 'md';
}

export function AdminCompanyMetrics({
  reviewCount,
  pageVisitCount,
  className,
  size = 'sm',
}: AdminCompanyMetricsProps) {
  const t = useTranslations('adminDirectory');

  return (
    <div
      className={cn(
        'shrink-0 text-end tabular-nums',
        size === 'sm' ? 'text-xs' : 'text-sm',
        className,
      )}
    >
      <p className={cn('font-medium text-primary', size === 'md' && 'text-base')}>
        {t('reviewCount', { count: reviewCount })}
      </p>
      <p className="text-secondary">{t('pageVisitCount', { count: pageVisitCount })}</p>
    </div>
  );
}
