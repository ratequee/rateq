import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StarRating } from '@/components/ui/star-rating';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/routing';
import { getLocale, getTranslations } from 'next-intl/server';
import type { JSX } from 'react';
import Image from 'next/image';

export async function HeroSection(): Promise<JSX.Element> {
  const locale = await getLocale();
  const t = await getTranslations('home');

  const trustBadges = [
    { icon: <Image src="/images/badge.svg" alt="Verified" width={20} height={20} />, label: t('badgeVerified') },
    { icon: <Image src="/images/users.svg" alt="Experiences" width={20} height={20} />, label: t('badgeExperiences') },
    { icon: <Image src="/images/shield.svg" alt="Trusted" width={20} height={20} />, label: t('badgeTrusted') },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-white to-slate-50/80 pb-12 pt-6 sm:pb-30 sm:pt-8 lg:pb-50" style={{ backgroundImage: 'url(/images/herobg.svg)', backgroundSize: 'cover', backgroundPosition: 'center', paddingTop: "50px", paddingBottom: "200px" }}>
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="max-w-full">
            <div className='flex flex-col justify-center md:justify-start items-center md:items-start'>
            <p className="mb-3 text-sm font-bold text-brand-500 sm:text-base">
              {t('heroEyebrow')}
            </p>
            <h1 className="text-center md:text-left text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl md:text-5xl md:leading-[1.1]">
              {t('heroTitlePrefix')}{' '}
              <span className="uppercase text-gold-300">{t('heroTitleHighlight')}</span>{' '}<hr className="w-full border-0" />
              {t('heroTitleSuffix')}
            </h1>
            <p className="mt-4 lg:text-base text-center text-ink-muted sm:text-lg">{t('heroSubtitle')}</p>
            </div>
            <form action={`/${locale}/search`} className="mt-8">
              <div className="relative flex items-center rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
                <Input
                  name="query"
                  placeholder={t('searchPlaceholder')}
                  className="h-14 flex-1 border-0 bg-transparent ps-5 text-base shadow-none focus-visible:ring-0"
                  required
                />
                <Button
                  type="submit"
                  variant={"ghost"}
                  size="lg"
                  aria-label={t('searchPlaceholder')}
                  className="h-11 shrink-0 rounded-lg px-5 mr-2"
                >
                  <Image src="/images/search.svg" alt="Search" width={20} height={20} />
                </Button>
              </div>
            </form>

            <div className="mt-6 flex justify-between md:justify-start items-center md:items-start flex-wrap gap-3">
              <Link href="/search">
                <Button size="lg" className="min-w-[160px] border-0 shadow-lg sm:min-w-[50%]">
                  {t('exploreCompanies')}
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline-brand" size="lg" className="min-w-[140px] sm:min-w-[50%] border-0 shadow-lg text-brand-500">
                  {t('forUsers')}
                </Button>
              </Link>
            </div>

            <ul className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {trustBadges.map(({ icon: IconComponent, label }) => (
                <li
                  key={label}
                  className="flex justify-center items-center gap-2 rounded-lg border-0 shadow-lg bg-white p-4 text-sm font-medium text-ink"
                >
                  {IconComponent}
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-full md:mx-[10px] lg:mx-0 lg:max-w-none lg:justify-self-end">
            <div className="absolute -start-[-10px] lg:-start-10 top-2 z-10 max-w-[350px] rounded-xl border border-slate-100 bg-white p-3 shadow-card sm:block lg:-end-8 lg:top-8">
              <div className="flex items-start gap-3">
                <Image src="/images/author.svg" alt="Category" width={50} height={50} className='rounded-full' />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-ink">{t('miniReviewAuthor')}</p>
                    <span className="shrink-0 text-xs text-ink-light">{t('miniReviewTime')}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <StarRating value={4.8} size="sm" />
                    <span className="text-xs text-ink-muted">{t('miniReviewCount')}</span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-ink-muted">
                    {t('miniReviewQuote')}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-hero">
              <div className="h-40 bg-gradient-to-br from-brand-500 to-brand-700 sm:h-48" style={{ height: '250px', backgroundImage: 'url(/images/building.svg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <div className="px-6 pb-6 sm:px-8 sm:pb-8">
                <div className="flex items-center justify-between rounded-2xl">
                  <div className="flex items-center gap-3">
                  <Image src="/images/company_avatar.svg" alt="Category" width={120} height={120} className='mt-[-50px]' />
                  <div className="flex flex-col items-start">
                    <p className="text-lg font-semibold text-ink text-left">{t('featuredReviewAuthor')}</p>
                    <p className="mt-1 text-sm text-ink-muted text-left">{t('featuredReviewRole')}</p>
                  </div>
                  </div>
                  <Badge className="border-gold-100 rounded-sm text-white bg-gold-500 px-2 py-1">
                    {t('featuredReviewCategory')}
                  </Badge>
                </div>
                <p className="mt-4 text-md leading-relaxed text-ink-muted">{t('featuredReviewText')}</p>
                <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-5">
                  <span className="text-5xl font-bold text-ink">4.8</span>
                  <StarRating value={4.8} size="lg" />
                  <span className="text-sm text-ink-muted">{t('featuredReviewReviews')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
