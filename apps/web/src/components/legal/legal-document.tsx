import { LegalCmsBody } from '@/components/legal/legal-cms-body';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/breadcrumbs';
import { Link } from '@/i18n/routing';
import { scrollRevealProps } from '@/lib/scroll-reveal';
import { getLocale, getTranslations } from 'next-intl/server';
import type { JSX } from 'react';

export interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

interface LegalDocumentProps {
  namespace: 'legalPrivacy' | 'legalTerms';
  /** When set, renders admin-managed content instead of built-in sections. */
  cmsContent?: string | null;
}

export async function LegalDocument({
  namespace,
  cmsContent,
}: LegalDocumentProps): Promise<JSX.Element> {
  const t = await getTranslations(namespace);
  const locale = await getLocale();
  const breadcrumbs = t.raw('breadcrumbs') as BreadcrumbItem[];
  const sections = t.raw('sections') as LegalSection[];
  const managed = Boolean(cmsContent?.trim());

  return (
    <>
      <section
        {...scrollRevealProps('fade-in')}
        className="relative overflow-hidden bg-gradient-to-b from-white via-white to-slate-50/80 pb-10 pt-6 dark:from-dm-bg dark:via-dm-bg dark:to-dm-bg sm:pb-14 sm:pt-8"
        style={{
          backgroundImage: 'url(/images/herobg.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 hidden bg-dm-bg/80 dark:block"
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-page flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-gold-600 dark:text-gold-300">
              {t('eyebrow')}
            </p>
            <h1 className="mt-2 text-balance text-3xl font-bold leading-tight tracking-tight text-ink dark:text-white sm:text-4xl md:text-5xl">
              {t('title')}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-ink-muted dark:text-white/90 sm:text-lg">
              {t('subtitle')}
            </p>
            {!managed ? (
              <p className="mt-3 text-sm text-ink-muted dark:text-white/70">
                {t('lastUpdated', { date: t('lastUpdatedDate') })}
              </p>
            ) : null}
          </div>
          <Breadcrumbs items={breadcrumbs} ariaLabel={t('breadcrumbAria')} />
        </div>
      </section>

      <section className="pb-16 pt-8 sm:pb-20 sm:pt-10">
        <div
          className={
            managed
              ? 'mx-auto max-w-page px-4 sm:px-6 lg:px-8'
              : 'mx-auto grid max-w-page gap-8 px-4 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12 lg:px-8'
          }
        >
          {!managed ? (
            <nav aria-label={t('tocLabel')} className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-subtle bg-white p-5 shadow-sm dark:bg-dm-elevated">
                <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                  {t('tocLabel')}
                </p>
                <ol className="mt-3 max-h-[70vh] space-y-1 overflow-auto text-sm">
                  {sections.map((section, index) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="flex gap-2 rounded-lg px-2 py-1.5 text-ink-muted transition-colors hover:bg-slate-50 hover:text-brand-600 dark:text-white/80 dark:hover:bg-dm-surface dark:hover:text-gold-300"
                      >
                        <span className="shrink-0 font-medium text-gold-600 dark:text-gold-300">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span>{section.title}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            </nav>
          ) : null}

          <article className="rounded-2xl border border-subtle bg-white p-6 shadow-sm dark:bg-dm-elevated sm:p-8 lg:p-10">
            {managed ? (
              <div dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                <LegalCmsBody content={cmsContent!.trim()} />
              </div>
            ) : (
              sections.map((section, index) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-28 border-b border-subtle py-8 first:pt-0 last:border-b-0 last:pb-0"
                >
                  <h2 className="flex items-baseline gap-3 text-xl font-bold text-ink dark:text-white sm:text-2xl">
                    <span className="text-base font-semibold text-gold-600 dark:text-gold-300">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {section.title}
                  </h2>
                  <div className="mt-4 space-y-4 text-base leading-7 text-ink-muted dark:text-slate-300">
                    {section.paragraphs.map((paragraph, paragraphIndex) => (
                      <p key={`${section.id}-p-${paragraphIndex}`}>{paragraph}</p>
                    ))}
                    {section.bullets && section.bullets.length > 0 ? (
                      <ul className="list-disc space-y-2 ps-5">
                        {section.bullets.map((item, bulletIndex) => (
                          <li key={`${section.id}-b-${bulletIndex}`}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </section>
              ))
            )}

            <div className="mt-10 flex flex-col gap-3 rounded-xl border border-brand-100 bg-brand-50/60 p-5 dark:border-brand-900/50 dark:bg-brand-950/30 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-muted dark:text-slate-300">{t('relatedText')}</p>
              <Link
                href={namespace === 'legalPrivacy' ? '/terms' : '/privacy'}
                className="text-sm font-semibold text-brand-600 hover:underline dark:text-gold-300"
              >
                {t('relatedLabel')}
              </Link>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
