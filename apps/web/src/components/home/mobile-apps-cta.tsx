import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import type { JSX } from 'react';

export async function MobileAppsCta(): Promise<JSX.Element> {
  const t = await getTranslations('home');

  return (
    <section className="py-4 sm:py-4 mt-10 mb-[-100px]">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl bg-gold-300 px-6 py-2 sm:px-2 sm:py-2 lg:px-2">
          <div
            className="grid items-center gap-2 lg:grid-cols-2 lg:gap-2 relative"
            style={{ height: '200px' }}
          >
            <Image
              src={'/images/phone.svg'}
              alt={'Mobile Apps'}
              width={320}
              height={500}
              className="object-cover hidden md:block absolute left-1 top-1/2 -translate-y-1/2"
            />
            <div className="text-center lg:text-start absolute left-0 right-0 md:left-1/2 md:right-auto top-1/2 -translate-y-1/2">
              <h2 className="mt-2 text-2xl font-bold text-black sm:text-3xl">{t('mobileTitle')}</h2>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <a href="#" aria-label={t('appStore')}>
                  <Image src={'/images/appstore.svg'} alt={'App Store'} width={150} height={43} />
                </a>
                <a href="#" aria-label={t('googlePlay')}>
                  <Image
                    src={'/images/playstore.svg'}
                    alt={'Google Play'}
                    width={150}
                    height={43}
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
