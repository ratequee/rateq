import { getTranslations } from 'next-intl/server';
import { homeDarkCard } from '@/components/home/home-dark-surfaces';
import Image from 'next/image';
import type { JSX } from 'react';
import { cn } from '@/lib/utils';

export async function WhyChooseSection(): Promise<JSX.Element> {
  const t = await getTranslations('home');

  const values = [
    {
      icon: (
        <Image
          src={'/images/tick_badge.svg'}
          alt={t('whyImageCaption')}
          width={40}
          height={40}
          className="object-cover"
        />
      ),
      titleKey: 'whyValue1Title' as const,
      descKey: 'whyValue1Desc' as const,
    },
    {
      icon: (
        <Image
          src={'/images/chart.svg'}
          alt={t('whyImageCaption')}
          width={55}
          height={55}
          className="object-cover"
        />
      ),
      titleKey: 'whyValue2Title' as const,
      descKey: 'whyValue2Desc' as const,
    },
    {
      icon: (
        <Image
          src={'/images/decision.svg'}
          alt={t('whyImageCaption')}
          width={40}
          height={40}
          className="object-cover"
        />
      ),
      titleKey: 'whyValue3Title' as const,
      descKey: 'whyValue3Desc' as const,
    },
  ];

  return (
    <section className="overflow-hidden py-12 dark:bg-[#323232] sm:py-16 lg:py-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="w-full h-full">
            <Image
              src={'/images/choose.svg'}
              alt={t('whyImageCaption')}
              width={0}
              height={0}
              className="w-full h-full object-cover rounded-tr-3xl rounded-br-3xl"
            />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-ink dark:text-white sm:text-3xl lg:text-4xl">
              {t('whyTitle')}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted dark:text-white/90 sm:text-lg">
              {t('whyDescription')}
            </p>

            <ul className="mt-8 space-y-4">
              {values.map(({ icon: Icon, titleKey, descKey }) => (
                <li
                  key={titleKey}
                  className={cn(
                    'flex gap-4 rounded-2xl border-2 border-slate-100 bg-white p-5 shadow-sm',
                    homeDarkCard,
                  )}
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl">
                    {Icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-ink dark:text-white">{t(titleKey)}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-muted dark:text-white/85">
                      {t(descKey)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
