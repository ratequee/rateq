import { CompanyHeroSection } from '@/components/company/company-hero-section';
import { CompanyRatingBreakdown } from '@/components/company/company-rating-breakdown';
import { CompanyReviewsSection } from '@/components/company/company-reviews-section';
import { RelatedCompaniesSection } from '@/components/company/related-companies-section';
import {
  getMockCompanyBySlug,
  getMockReviewsByCompany,
  MOCK_COMPANY_SLUGS,
} from '@/lib/mock-companies';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { JSX } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { Mail, MapPin, PenLine, Phone, Star } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

interface CompanyPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return MOCK_COMPANY_SLUGS.flatMap((slug) =>
    ['en', 'ar'].map((locale) => ({ locale, slug })),
  );
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = getMockCompanyBySlug(slug);

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
  const company = getMockCompanyBySlug(slug);

  if (!company) {
    notFound();
  }

  const reviews = getMockReviewsByCompany(company.id);

  return (
    <>
      <CompanyHeroSection company={company} />

      <div className="mx-auto max-w-page px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px] lg:gap-10 xl:grid-cols-[1fr_320px]">
        <div className="mx-auto max-w-page mt-20 overflow-hidden rounded-2xl border border-slate-100 bg-[#F9F9F9] shadow-card">
          <div className="relative h-40 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 sm:h-48 lg:h-52 px-4 sm:px-6 lg:px-8">
          <div className="mb-2 flex flex-wrap gap-2 absolute top-10 left-10">
            <Badge className="border-0 py-2 px-4 bg-gold-500 text-white rounded-sm">
              {t('verifiedBadge')}
            </Badge>
            <Badge className="border-0 py-2 px-4 bg-white text-brand-500 rounded-sm">
              {t('claimedBadge')}
            </Badge>
          </div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(237,197,111,0.2),transparent_55%)]" />
          </div>

          <div className="px-5 pb-6 sm:px-8 sm:pb-8 relative bg-white rounded-b-2xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row">
                {company.logo ? (
                  <img
                    src={company.logo}
                    alt=""
                    className="h-24 w-24 shrink-0 absolute top-[-40px] left-0 rounded-2xl border-4 border-white bg-white object-cover shadow-md sm:h-28 sm:w-28 relative z-10"
                  />
                ) : (
                  <div className="flex h-24 w-24 shrink-0 absolute top-[-50px] left-0  items-center justify-center rounded-2xl border-4 border-white bg-brand-100 text-3xl font-bold text-brand-500 shadow-md sm:h-28 sm:w-28">
                    {company.name.charAt(0)}
                  </div>
                )}

                <div className="min-w-0 pt-1 sm:pb-1 flex gap-2">
                  <div>
                  <h1 className="text-xl font-bold text-ink sm:text-3xl lg:text-2xl">{company.name}</h1>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-muted sm:text-base">
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                    {company.city}, {company.country}
                  </p>
                  </div>
                <div className="flex flex-col items-center gap-3 mt-2">
                  <Link href="https://www.google.com" target="_blank" className="text-sm text-brand-500 hover:text-brand-600 underline">
                  Visit Website
                  </Link>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-gold-500 stroke-2 fill-gold-500" />
                    <span className="text-sm font-bold leading-none text-ink sm:text-lg">
                      {company.ratingAverage.toFixed(1)}
                    </span>
                    <p className="mt-1 text-sm text-ink-muted">
                      ({t('reviewCount', { count: company.reviewCount })})
                    </p>
                  </div>
                </div>
                </div>
              </div>
            </div>
            <hr className="mt-1 mb-6 border-slate-300 border-b-1" />
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Link href={`tel:+966555555555`}>
                  <Phone className="h-5 w-5" />
                </Link>
                +966 555 555 555
              </div >
              <div className="flex items-center gap-2">
                <Link href={`mailto:info@rateq.com`}>
                  <Mail className="h-5 w-5" />
                </Link>
                info@rateq.com
              </div>
                  <Link href="#write-review">
                    <Button size="lg" className="gap-2">
                      <PenLine className="h-4 w-4" />
                      {t('writeReview')}
                    </Button>
                  </Link>
                </div>
          </div>
          <div className="mt-6 p-4 rounded-2xl">
            <h2 className="text-lg font-bold text-ink sm:text-xl lg:text-2xl">About {company.name}</h2>
            {company.description && (
              <p className="my-6 max-w-3xl text-sm leading-relaxed text-ink-muted sm:text-base">
                {company.description}
              </p>
            )}
          </div>
        </div>
          <div className="mt-20">
            <CompanyRatingBreakdown reviews={reviews.data} average={company.ratingAverage} />
          </div>
          <CompanyReviewsSection company={company} reviews={reviews.data} />
        </div>
      </div>

      <RelatedCompaniesSection company={company} />
    </>
  );
}
