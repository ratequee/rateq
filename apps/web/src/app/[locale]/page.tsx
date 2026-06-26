import { LatestBlogSection } from '@/components/home/latest-blog-section';
import { CategoryCarousel } from '@/components/home/category-carousel';
import { FeaturedCompaniesSection } from '@/components/home/featured-companies-section';
import { HeroSection } from '@/components/home/hero-section';
// import { MobileAppsCta } from '@/components/home/mobile-apps-cta';
import { NearbyMapSection } from '@/components/home/nearby-map-section';
// import { PartnersSection } from '@/components/home/partners-section';
import { StatsBar } from '@/components/home/stats-bar';
import { TestimonialsCarousel } from '@/components/home/testimonials-carousel';
import { WhyChooseSection } from '@/components/home/why-choose-section';
import { fetchBlogPosts } from '@/lib/blog-data';
import { fetchCategories } from '@/lib/categories-data';
import { fetchCompanies } from '@/lib/companies-data';
import { fetchPlatformStats } from '@/lib/platform-data';
import { fetchFeaturedReviews, fetchLatestCompanyReview } from '@/lib/reviews-data';
import type { BlogLocale } from '@rateq/types';
import type { JSX } from 'react';
import { getLocale } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function HomePage(): Promise<JSX.Element> {
  const locale = (await getLocale()) as BlogLocale;
  const [
    companiesResult,
    nearbyResult,
    categories,
    stats,
    featuredReviews,
    topCompanyResult,
    blogResult,
  ] = await Promise.all([
    fetchCompanies(new URLSearchParams({ sort: 'rating', limit: '6' })),
    fetchCompanies(new URLSearchParams({ sort: 'rating', limit: '12' })),
    fetchCategories(),
    fetchPlatformStats(),
    fetchFeaturedReviews(6),
    fetchCompanies(new URLSearchParams({ sort: 'rating', limit: '1' })),
    fetchBlogPosts(locale, 3, 1),
  ]);

  const companies = companiesResult.data;
  const nearbyCompanies = nearbyResult.data;
  const carouselCategories = categories.slice(0, 8);
  const topCompany = topCompanyResult.data[0] ?? null;
  const heroReview =
    topCompany && topCompany.reviewCount > 0 ? await fetchLatestCompanyReview(topCompany.id) : null;

  return (
    <div className="dark:bg-[#323232]">
      <HeroSection topCompany={topCompany} latestReview={heroReview} />
      <NearbyMapSection companies={nearbyCompanies} />
      <CategoryCarousel categories={carouselCategories} />
      <FeaturedCompaniesSection companies={companies} />
      <LatestBlogSection posts={blogResult.data} locale={locale} />
      <StatsBar stats={stats} />
      <TestimonialsCarousel reviews={featuredReviews} />
      <WhyChooseSection />
      {/* <PartnersSection /> */}
      {/* <MobileAppsCta /> */}
    </div>
  );
}
