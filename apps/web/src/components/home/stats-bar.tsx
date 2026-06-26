import { getTranslations } from 'next-intl/server';
import { formatStatNumber } from '@/lib/platform-data';
import type { PlatformStats } from '@rateq/types';
import Image from 'next/image';
import type { JSX } from 'react';

interface StatsBarProps {
  stats: PlatformStats;
}

export async function StatsBar({ stats }: StatsBarProps): Promise<JSX.Element> {
  const t = await getTranslations('home');

  const items = [
    {
      icon: <Image src="/images/stats1.svg" alt="building" width={50} height={50} />,
      value: formatStatNumber(stats.totalCompanies),
      label: t('statCompanies'),
    },
    {
      icon: <Image src="/images/stats2.svg" alt="people" width={50} height={50} />,
      value: formatStatNumber(stats.totalReviewers),
      label: t('statUsers'),
    },
    {
      icon: <Image src="/images/stats3.svg" alt="comments" width={50} height={50} />,
      value: formatStatNumber(stats.totalReviews),
      label: t('statReviews'),
    },
  ];

  return (
    <section className="py-12 dark:bg-dm-bg sm:py-16 lg:py-20" aria-label={t('statsAria')}>
      <div
        className="mx-auto max-w-page rounded-3xl bg-brand-500 p-20 px-4 sm:px-6 lg:px-8 dark:bg-gradient-to-br dark:from-brand-900 dark:via-brand-700 dark:to-brand-600"
        style={{
          backgroundImage: 'url(/images/statsbg.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="grid gap-8 sm:grid-cols-3 sm:gap-4">
          {items.map(({ icon, value, label }, index) => (
            <div
              key={label}
              style={{ borderRight: index < items.length - 1 ? '1px solid #ffffff' : 'none' }}
              className="flex justify-center items-center gap-3 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-start sm:even:border-x sm:even:border-white/20 sm:even:px-6"
            >
              <div className="shrink-0 rounded-2xl">{icon}</div>
              <div>
                <p className="text-3xl font-bold text-white sm:text-4xl">{value}</p>
                <p className="mt-1 text-sm font-medium text-white/85 sm:text-base">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
