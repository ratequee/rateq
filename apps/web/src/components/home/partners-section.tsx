import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import type { JSX } from 'react';

const PARTNER_LOGOS = [
  '/images/partner1.png',
  '/images/partner2.png',
  '/images/partner3.png',
  '/images/partner4.png',
  '/images/partner5.png',
];

export async function PartnersSection(): Promise<JSX.Element> {
  const t = await getTranslations('home');

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-page px-4 text-center sm:px-6 lg:px-8">
        <h2 className="mx-auto max-w-4xl text-balance text-sm font-regular text-ink sm:text-lg">
          {t('partnersTitle')}
        </h2>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-8 sm:gap-12 lg:gap-16">
          {PARTNER_LOGOS.map((partner) => (
            <div
              key={partner}
              className="flex h-10 min-w-[120px] items-center justify-center rounded-lg px-6 sm:h-12 sm:min-w-[140px]"
            >
              <Image
                src={partner}
                alt=""
                width={120}
                height={48}
                className="h-10 w-auto object-contain sm:h-12"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
