import { getTranslations } from 'next-intl/server';
import type { CompanyPublic } from '@rateq/types';
import { isRemoteImageSrc } from '@/lib/image-src';
import Image from 'next/image';
import type { JSX } from 'react';

const FALLBACK_PARTNERS = [
  '/images/partner1.svg',
  '/images/partner2.svg',
  '/images/partner3.svg',
  '/images/partner4.svg',
  '/images/partner5.svg',
];

interface PartnersSectionProps {
  companies?: CompanyPublic[];
}

export async function PartnersSection({
  companies = [],
}: PartnersSectionProps): Promise<JSX.Element> {
  const t = await getTranslations('home');

  const logos = companies
    .map((company) => company.logo)
    .filter((logo): logo is string => Boolean(logo))
    .slice(0, 5);

  const partners = logos.length > 0 ? logos : FALLBACK_PARTNERS;

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-page px-4 text-center sm:px-6 lg:px-8">
        <h2 className="mx-auto max-w-4xl text-balance text-sm font-regular text-ink sm:text-lg">
          {t('partnersTitle')}
        </h2>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-8 sm:gap-12 lg:gap-16">
          {partners.map((partner, index) => (
            <div
              key={`${partner}-${index}`}
              className="flex h-10 min-w-[120px] items-center justify-center rounded-lg px-6 sm:h-12 sm:min-w-[140px]"
            >
              {isRemoteImageSrc(partner) ? (
                <img
                  src={partner}
                  alt=""
                  width={120}
                  height={48}
                  className="h-10 w-auto object-contain sm:h-12"
                />
              ) : (
                <Image
                  src={partner}
                  alt=""
                  width={120}
                  height={48}
                  className="h-10 w-auto object-contain sm:h-12"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
