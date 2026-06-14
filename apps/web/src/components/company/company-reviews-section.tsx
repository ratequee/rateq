import type { CategoryServicePublic, CompanyPublic, ReviewPublic } from '@rateq/types';
import { CompanyReviewsSectionClient } from '@/components/company/company-reviews-section-client';
import type { JSX } from 'react';

interface CompanyReviewsSectionProps {
  company: CompanyPublic;
  reviews: ReviewPublic[];
  categoryServices?: CategoryServicePublic[];
}

export function CompanyReviewsSection({
  company,
  reviews,
  categoryServices = [],
}: CompanyReviewsSectionProps): JSX.Element {
  return (
    <CompanyReviewsSectionClient
      company={company}
      initialReviews={reviews}
      categoryServices={categoryServices}
    />
  );
}
