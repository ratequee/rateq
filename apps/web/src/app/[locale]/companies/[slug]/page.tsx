import { CompanyContentTabs } from '@/components/company/company-content-tabs';
import { CompanyPageViewTracker } from '@/components/company/company-page-view-tracker';
import { CompanyHeroSection } from '@/components/company/company-hero-section';
import { CompanyRatingBreakdown } from '@/components/company/company-rating-breakdown';
import { RelatedCompaniesSection } from '@/components/company/related-companies-section';
import { fetchCompanyBySlug } from '@/lib/companies-data';
import { fetchCategoryServicesForCompany } from '@/lib/categories-data';
import { reviewsApi } from '@/lib/api';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { JSX } from 'react';
import { CompanyWriteReviewButton } from '@/components/company/company-write-review-button';
import { CompanyShareButton } from '@/components/company/company-share-button';
import { Badge } from '@/components/ui/badge';
import { Mail, MapPin, Phone, Star } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
// import { MobileAppsCta } from '@/components/home/mobile-apps-cta';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

interface CompanyPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await fetchCompanyBySlug(slug);

  if (!company) {
    return { title: 'Company' };
  }

  return {
    title: company.name,
    description: company.description ?? `${company.name} reviews and ratings on RateQ`,
    openGraph: {
      title: `${company.name} | RateQ`,
      description: `${company.ratingAverage}★ · ${company.reviewCount} reviews`,
    },
  };
}

export default async function CompanyPage({ params }: CompanyPageProps): Promise<JSX.Element> {
  const t = await getTranslations('companyPage');
  const { slug } = await params;
  const company = await fetchCompanyBySlug(slug);

  if (!company) {
    notFound();
  }

  const categoryServices = await fetchCategoryServicesForCompany(company.categoryId);

  let reviews = { data: [] as Awaited<ReturnType<typeof reviewsApi.listByCompany>>['data'] };
  try {
    reviews = await reviewsApi.listByCompany(company.id);
  } catch {
    reviews = { data: [] };
  }

  const topMentions = [
    ...new Set(
      reviews.data.map((review) => {
        const words = review.title.trim().split(/\s+/);
        if (words.length <= 3) return review.title;
        return words.slice(0, 3).join(' ');
      }),
    ),
  ].slice(0, 6);

  return (
    <>
      <CompanyPageViewTracker slug={slug} />
      <CompanyHeroSection company={company} />

      <div className="mx-auto max-w-page px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="mt-20 min-w-0 overflow-hidden rounded-2xl border border-subtle bg-[#F9F9F9] shadow-card dark:bg-slate-900">
            <div className="relative h-40 overflow-hidden sm:h-48 lg:h-52">
              {company.coverUrl ? (
                <>
                  <img
                    src={company.coverUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/25" />
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(237,197,111,0.2),transparent_55%)]" />
                </>
              )}
              <div className="absolute top-10 z-10 flex flex-wrap gap-2 start-5 sm:start-8">
                <Badge className="rounded-sm border-0 bg-gold-500 px-4 py-2 text-white">
                  {t('verifiedBadge')}
                </Badge>
                <Badge className="rounded-sm border-0 bg-white px-4 py-2 text-brand-500 dark:bg-slate-800 dark:text-brand-300">
                  {t('claimedBadge')}
                </Badge>
              </div>
            </div>

            <div className="rounded-b-2xl bg-white px-5 pb-6 dark:bg-slate-900 sm:px-8 sm:pb-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-6">
                <div className="-mt-12 shrink-0 sm:-mt-14">
                  {company.logo ? (
                    <img
                      src={company.logo}
                      alt=""
                      className="relative z-10 h-24 w-24 rounded-2xl border-4 border-white bg-white object-cover shadow-md dark:border-slate-900 dark:bg-slate-800 sm:h-28 sm:w-28"
                    />
                  ) : (
                    <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-brand-100 text-3xl font-bold text-brand-500 shadow-md dark:border-slate-900 dark:bg-brand-950 sm:h-28 sm:w-28">
                      {company.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mt-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-xl font-bold text-primary sm:text-3xl lg:text-2xl">
                        {company.name}
                      </h1>
                      <Image
                        src="/images/verified_badge.svg"
                        alt={t('verifiedBadge')}
                        width={48}
                        height={48}
                        className="h-10 w-10 shrink-0 sm:h-12 sm:w-12"
                      />
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-secondary sm:text-base">
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                      {company.city}, {company.country}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-3 sm:items-end">
                    {company.websiteUrl ? (
                      <a
                        href={
                          company.websiteUrl.startsWith('http')
                            ? company.websiteUrl
                            : `https://${company.websiteUrl}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-brand-500 hover:underline sm:text-base"
                      >
                        {t('visitWebsite')}
                      </a>
                    ) : null}
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-gold-500 stroke-2 text-gold-500" />
                      <span className="text-sm font-bold leading-none text-primary sm:text-lg">
                        {company.ratingAverage.toFixed(1)}
                      </span>
                      <p className="text-sm text-secondary">
                        ({t('reviewCount', { count: company.reviewCount })})
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="mb-6 mt-6 border-default" />

              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  {company.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      <a
                        href={`tel:${company.phone.replace(/\s/g, '')}`}
                        className="hover:text-brand-500"
                      >
                        {company.phone}
                      </a>
                    </div>
                  )}
                  {company.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      <a href={`mailto:${company.email}`} className="hover:text-brand-500">
                        {company.email}
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <CompanyShareButton slug={slug} companyName={company.name} />
                  <CompanyWriteReviewButton label={t('writeReview')} />
                </div>
              </div>
            </div>

            {company.description ? (
              <div className="mt-8 border-t border-subtle surface-muted p-8">
                <h2 className="text-lg font-bold text-primary sm:text-xl lg:text-2xl">
                  {t('aboutTitle', { name: company.name })}
                </h2>
                <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-secondary sm:text-base">
                  {company.description}
                </p>
                <a href="#reviews-hub">
                  <Button className="mt-4">{t('reviewsText')}</Button>
                </a>
              </div>
            ) : null}
          </div>

          <div className="mt-20 lg:self-start">
            <CompanyRatingBreakdown
              average={company.ratingAverage}
              reviewCount={company.reviewCount}
              distribution={company.ratingDistribution}
            />
          </div>
        </div>

        <div id="reviews-hub" className="mt-10 scroll-mt-14">
          <CompanyContentTabs
            company={company}
            reviews={reviews.data}
            topMentions={topMentions}
            categoryServices={categoryServices}
            projects={company.projects}
            serviceItems={company.serviceItems}
            activityItems={company.activityItems}
            services={company.services}
          />
        </div>
      </div>

      <RelatedCompaniesSection company={company} />
      {/* <MobileAppsCta /> */}
    </>
  );
}
