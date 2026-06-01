import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import type { JSX } from 'react';
import React from 'react';

export async function StatsBar(): Promise<JSX.Element> {
  const t = await getTranslations('home');

  const stats = [
    { icon: <Image src={"/images/stats1.svg"} alt={"building"} width={50} height={50} />, value: '3,500', label: t('statCompanies') },
    { icon: <Image src={"/images/stats2.svg"} alt={"people"} width={50} height={50} />, value: '18K', label: t('statUsers') },
    { icon: <Image src={"/images/stats3.svg"} alt={"comments"} width={50} height={50} />, value: '36K', label: t('statReviews') },
  ];

  return (
    <section className="py-10 sm:py-12" aria-label={t('statsAria')}>
      <div className="mx-auto max-w-page p-20 rounded-3xl bg-brand-500 px-4 sm:px-6 lg:px-8" style={{backgroundImage: 'url(/images/statsbg.svg)', backgroundSize: 'cover', backgroundPosition: 'center'}}>
        <div className="grid gap-8 sm:grid-cols-3 sm:gap-4">
          {stats.map(({ icon: Icon, value, label }, index) => (
            <div
              key={label}
              style={{borderRight: index < stats.length - 1 ? '1px solid #ffffff' : 'none'}}
              className="flex flex-col justify-center items-center gap-3 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-start sm:even:border-x sm:even:border-white/20 sm:even:px-6"
              >
              <div className="shrink-0 rounded-2xl">
                {Icon}
              </div>
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
