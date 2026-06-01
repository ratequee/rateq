import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import type { JSX } from 'react';

const PARTNERS = ['/images/partner1.svg', '/images/partner2.svg', '/images/partner3.svg', '/images/partner4.svg', '/images/partner5.svg'];

export async function PartnersSection(): Promise<JSX.Element> {
  const t = await getTranslations('home');

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-page px-4 text-center sm:px-6 lg:px-8">
        <h2 className="mx-auto max-w-4xl text-balance text-sm font-regular text-ink sm:text-lg">
          {t('partnersTitle')}
        </h2>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-8 sm:gap-12 lg:gap-16">
          {PARTNERS.map((partner, index) => (
            <div
              key={index}
              className="flex h-10 min-w-[120px] items-center justify-center rounded-lg px-6 text-sm font-semibold tracking-wide text-slate-400 sm:h-12 sm:min-w-[140px]"
              // aria-label={index}
            >
              <Image src={partner} alt={index.toString()} width={120} height={120} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
