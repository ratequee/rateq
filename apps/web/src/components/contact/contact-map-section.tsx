import { getTranslations } from 'next-intl/server';
import type { JSX } from 'react';

export async function ContactMapSection(): Promise<JSX.Element> {
  const t = await getTranslations('contact');

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
          <div className="border-b border-slate-100 px-6 py-4 sm:px-8">
            <h2 className="text-lg font-semibold text-ink sm:text-xl">{t('mapTitle')}</h2>
            <p className="mt-1 text-sm text-ink-muted">{t('mapSubtitle')}</p>
          </div>
          <div
            className="relative flex aspect-[16/7] min-h-[240px] items-center justify-center bg-gradient-to-br from-slate-100 via-emerald-50/40 to-slate-100"
            role="img"
            aria-label={t('mapAlt')}
          >
            <svg
              className="absolute inset-0 h-full w-full opacity-25"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <defs>
                <pattern id="contact-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#contact-grid)" />
            </svg>
            <div className="relative rounded-full bg-white/90 px-5 py-2.5 text-sm font-medium text-ink shadow-sm">
              {t('mapLocation')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
