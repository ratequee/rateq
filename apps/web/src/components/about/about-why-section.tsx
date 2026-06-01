import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import type { JSX } from 'react';

export async function AboutWhySection(): Promise<JSX.Element> {
  const t = await getTranslations('about');

  const values = [
    {
      icon: (
        <Image src="/images/tick_badge.svg" alt="" width={40} height={40} className="object-cover" />
      ),
      titleKey: 'whyValue1Title' as const,
      descKey: 'whyValue1Desc' as const,
    },
    {
      icon: <Image src="/images/chart.svg" alt="" width={55} height={55} className="object-cover" />,
      titleKey: 'whyValue2Title' as const,
      descKey: 'whyValue2Desc' as const,
    },
    {
      icon: (
        <Image src="/images/decision.svg" alt="" width={40} height={40} className="object-cover" />
      ),
      titleKey: 'whyValue3Title' as const,
      descKey: 'whyValue3Desc' as const,
    },
  ];

  return (
    <section className="bg-slate-50/60 py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl lg:text-4xl">{t('whyTitle')}</h2>
          <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">{t('whyDescription')}</p>
        </div>

        <ul className="mx-auto mt-10 max-w-3xl space-y-4">
          {values.map(({ icon, titleKey, descKey }) => (
            <li
              key={titleKey}
              className="flex gap-4 rounded-2xl border-2 border-slate-100 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl">
                {icon}
              </div>
              <div>
                <h3 className="font-bold text-ink">{t(titleKey)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted sm:text-base">{t(descKey)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
