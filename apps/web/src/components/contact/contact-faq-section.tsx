import { getTranslations } from 'next-intl/server';
import type { JSX } from 'react';

const FAQ_KEYS = [
  { q: 'faq1Question' as const, a: 'faq1Answer' as const },
  { q: 'faq2Question' as const, a: 'faq2Answer' as const },
  { q: 'faq3Question' as const, a: 'faq3Answer' as const },
  { q: 'faq4Question' as const, a: 'faq4Answer' as const },
];

export async function ContactFaqSection(): Promise<JSX.Element> {
  const t = await getTranslations('contact');

  return (
    <section className="bg-slate-50/60 py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">{t('faqTitle')}</h2>
          <p className="mt-3 text-base text-ink-muted">{t('faqSubtitle')}</p>
        </div>

        <dl className="mx-auto mt-10 max-w-3xl space-y-4">
          {FAQ_KEYS.map(({ q, a }) => (
            <div
              key={q}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6"
            >
              <dt className="font-semibold text-ink">{t(q)}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-ink-muted sm:text-base">{t(a)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
