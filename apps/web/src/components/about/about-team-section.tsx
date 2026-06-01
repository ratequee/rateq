'use client';

import { CarouselControls } from '@/components/home/carousel-controls';
import { SectionHeader } from '@/components/home/section-header';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRef } from 'react';

const TEAM = [
  { id: '1', nameKey: 'team1Name' as const, roleKey: 'team1Role' as const, image: '/images/author.svg' },
  { id: '2', nameKey: 'team2Name' as const, roleKey: 'team2Role' as const, image: '/images/author.svg' },
  { id: '3', nameKey: 'team3Name' as const, roleKey: 'team3Role' as const, image: '/images/author.svg' },
  { id: '4', nameKey: 'team4Name' as const, roleKey: 'team4Role' as const, image: '/images/author.svg' },
];

export function AboutTeamSection() {
  const t = useTranslations('about');
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'prev' | 'next') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'next' ? 320 : -320, behavior: 'smooth' });
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title={t('teamTitle')}
          controls={
            <CarouselControls
              onPrev={() => scroll('prev')}
              onNext={() => scroll('next')}
              prevLabel={t('carouselPrev')}
              nextLabel={t('carouselNext')}
              className="hidden sm:flex"
            />
          }
        />
        <p className="-mt-4 mb-8 max-w-xl text-base text-ink-muted">{t('teamSubtitle')}</p>

        <div
          ref={scrollRef}
          className="scrollbar-hide -mx-4 grid auto-cols-[minmax(280px,1fr)] grid-flow-col gap-5 overflow-x-auto px-4 sm:mx-0 sm:auto-cols-fr sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4"
        >
          {TEAM.map(({ id, nameKey, roleKey, image }) => (
            <article
              key={id}
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
            >
              <div
                className="h-40 shrink-0 bg-gradient-to-br from-brand-500/90 to-brand-700 sm:h-44"
                style={{
                  backgroundImage: 'url(/images/building.svg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <div className="relative px-5 pb-5 pt-12">
                <Image
                  src={image}
                  alt=""
                  width={64}
                  height={64}
                  className="absolute -top-8 start-5 rounded-full border-4 border-white bg-white"
                />
                <h3 className="font-semibold text-ink">{t(nameKey)}</h3>
                <p className="mt-1 text-sm text-ink-muted">{t(roleKey)}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
