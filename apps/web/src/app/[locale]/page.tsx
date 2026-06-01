import { CategoryCarousel } from '@/components/home/category-carousel';
import { FeaturedCompaniesSection } from '@/components/home/featured-companies-section';
import { HeroSection } from '@/components/home/hero-section';
import { MobileAppsCta } from '@/components/home/mobile-apps-cta';
import { NearbyMapSection } from '@/components/home/nearby-map-section';
import { PartnersSection } from '@/components/home/partners-section';
import { StatsBar } from '@/components/home/stats-bar';
import { TestimonialsSection } from '@/components/home/testimonials-section';
import { WhyChooseSection } from '@/components/home/why-choose-section';
import { searchMockCompanies } from '@/lib/mock-companies';
import type { JSX } from 'react';

export default async function HomePage(): Promise<JSX.Element> {
  const params = new URLSearchParams({ sort: 'rating', limit: '6' });
  const { data: companies } = searchMockCompanies(params);

  return (
    <>
      <HeroSection />
      <NearbyMapSection />
      <CategoryCarousel />
      <FeaturedCompaniesSection companies={companies} />
      <StatsBar />
      <TestimonialsSection />
      <WhyChooseSection />
      <PartnersSection />
      <MobileAppsCta />
    </>
  );
}
