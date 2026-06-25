import { getTranslations } from 'next-intl/server';
import { formatStatNumber } from '@/lib/platform-data';
import type { PlatformStats } from '@rateq/types';
import Image from 'next/image';
import type { JSX } from 'react';

interface AboutStorySectionProps {
  stats: PlatformStats;
}

export async function AboutStorySection({ stats }: AboutStorySectionProps): Promise<JSX.Element> {
  const t = await getTranslations('about');

  const statItems = [
    { value: formatStatNumber(stats.totalCompanies), label: t('storyStatCompanies') },
    { value: formatStatNumber(stats.totalReviewers), label: t('storyStatReviewers') },
    { value: formatStatNumber(stats.totalReviews), label: t('storyStatReviews') },
  ];

  return (
    <section className="overflow-hidden py-12 dark:bg-slate-950 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold text-brand-500 dark:text-brand-300 sm:text-3xl lg:text-xl">
            {t('storyTitle')}
          </h2>
          <h2 className="text-2xl font-bold text-ink dark:text-white sm:text-3xl lg:text-4xl">
            {t('storyWhat')}
          </h2>
          <p className="mt-4 text-center leading-relaxed text-ink-muted dark:text-white/85 sm:text-lg">
            {t('storyP1')}
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {statItems.map(({ value, label }) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <p className="text-3xl font-bold text-brand-500 dark:text-brand-300 sm:text-4xl">
                {value}
              </p>
              <p className="mt-2 text-sm text-ink-muted dark:text-white/85 sm:text-base">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative w-full overflow-hidden rounded-2xl">
            <Image
              src="/images/choose.svg"
              alt={t('storyImageAlt')}
              width={0}
              height={0}
              className="h-auto w-full object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-brand-500 dark:text-brand-300 sm:text-3xl lg:text-xl">
              2018
            </h2>
            <h2 className="text-2xl font-bold text-ink dark:text-white sm:text-3xl lg:text-4xl">
              {t('metaWe')}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted dark:text-white/85 sm:text-lg">
              {t('storyP1')}
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-muted dark:text-white/85">
              {t('storyP2')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
