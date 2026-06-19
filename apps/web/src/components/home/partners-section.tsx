import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import type { JSX } from 'react';

const PARTNER_LOGOS = [
  '/images/partner1.svg',
  '/images/partner2.svg',
  '/images/partner3.svg',
  '/images/partner4.svg',
  '/images/partner5.svg',
];

export async function PartnersSection(): Promise<JSX.Element> {
  const t = await getTranslations('home');

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-page px-4 text-center sm:px-6 lg:px-8">
        <h2 className="mx-auto max-w-4xl text-balance text-sm font-regular text-ink sm:text-lg">
          {t('partnersTitle')}
        </h2>
        <div className="mt-10 grid grid-cols-5 items-center justify-items-center gap-2 sm:gap-4 lg:gap-8">
          {PARTNER_LOGOS.map((partner) => (
            <div key={partner} className="flex w-full max-w-[120px] items-center justify-center">
              <Image
                src={partner}
                alt=""
                width={120}
                height={33}
                className="h-7 w-full max-w-[64px] object-contain sm:h-8 sm:max-w-[90px] lg:h-9 lg:max-w-[120px]"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
