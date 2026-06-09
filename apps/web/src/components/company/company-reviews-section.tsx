import type { CompanyPublic } from '@rateq/types';
import type { ReviewPublic } from '@rateq/types';
import { CompanyReviewsSectionClient } from '@/components/company/company-reviews-section-client';
import type { JSX } from 'react';

interface CompanyReviewsSectionProps {
  company: CompanyPublic;
  reviews: ReviewPublic[];
}

export function CompanyReviewsSection({
  company,
  reviews,
}: CompanyReviewsSectionProps): JSX.Element {
  return <CompanyReviewsSectionClient company={company} initialReviews={reviews} />;
}
