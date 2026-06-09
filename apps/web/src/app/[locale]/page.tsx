import { CategoryCarousel } from '@/components/home/category-carousel';
import { FeaturedCompaniesSection } from '@/components/home/featured-companies-section';
import { HeroSection } from '@/components/home/hero-section';
import { MobileAppsCta } from '@/components/home/mobile-apps-cta';
import { NearbyMapSection } from '@/components/home/nearby-map-section';
import { PartnersSection } from '@/components/home/partners-section';
import { StatsBar } from '@/components/home/stats-bar';
import { TestimonialsSection } from '@/components/home/testimonials-section';
import { WhyChooseSection } from '@/components/home/why-choose-section';
import { fetchCategories } from '@/lib/categories-data';
import { fetchCompanies } from '@/lib/companies-data';
import type { JSX } from 'react';

export default async function HomePage(): Promise<JSX.Element> {
  const [companiesResult, nearbyResult, categories] = await Promise.all([
    fetchCompanies(new URLSearchParams({ sort: 'rating', limit: '6' })),
    fetchCompanies(new URLSearchParams({ sort: 'rating', limit: '12' })),
    fetchCategories(),
  ]);
  const companies = companiesResult.data;
  const nearbyCompanies = nearbyResult.data;
  const carouselCategories = categories.slice(0, 8);

  return (
    <>
      <HeroSection />
      <NearbyMapSection companies={nearbyCompanies} />
      <CategoryCarousel categories={carouselCategories} />
      <FeaturedCompaniesSection companies={companies} />
      <StatsBar />
      <TestimonialsSection />
      <WhyChooseSection />
      <PartnersSection />
      <MobileAppsCta />
    </>
  );
}
