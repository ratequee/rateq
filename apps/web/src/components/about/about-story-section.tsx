import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import type { JSX } from 'react';

export async function AboutStorySection(): Promise<JSX.Element> {
  const t = await getTranslations('about');

  return (
    <section className="overflow-hidden py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center mb-10">
          <h2 className="text-xl font-bold text-brand-500 sm:text-3xl lg:text-xl">{t('storyTitle')}</h2>
          <h2 className="text-2xl font-bold text-ink sm:text-3xl lg:text-4xl">{t('storyWhat')}</h2>
          <p className="mt-4 text-center leading-relaxed text-ink-muted sm:text-lg">{t('storyP1')}</p>
        </div>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16 mt-20">
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
          <h2 className="text-xl font-bold text-brand-500 sm:text-3xl lg:text-xl">2018</h2>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl lg:text-4xl">{t('metaWe')}</h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">{t('storyP1')}</p>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">{t('storyP2')}</p>
          </div>
        </div>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16 mt-20">

          <div>
          <h2 className="text-xl font-bold text-brand-500 sm:text-3xl lg:text-xl">2018</h2>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl lg:text-4xl">{t('metaWe')}</h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">{t('storyP1')}</p>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">{t('storyP2')}</p>
          </div>
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
        </div>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16 mt-20">
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
          <h2 className="text-xl font-bold text-brand-500 sm:text-3xl lg:text-xl">2018</h2>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl lg:text-4xl">{t('metaWe')}</h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">{t('storyP1')}</p>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">{t('storyP2')}</p>
          </div>
        </div>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16 mt-20">
          <div>
          <h2 className="text-xl font-bold text-brand-500 sm:text-3xl lg:text-xl">2018</h2>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl lg:text-4xl">{t('metaWe')}</h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">{t('storyP1')}</p>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">{t('storyP2')}</p>
          </div>
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
        </div>
      </div>
    </section>
  );
}
