'use client';

import { CompanyReviewsSectionClient } from '@/components/company/company-reviews-section-client';
import type { CompanyPublic } from '@rateq/types';

interface CompanyReviewsSectionProps {
  company: CompanyPublic;
}

export function CompanyReviewsSection({ company }: CompanyReviewsSectionProps) {
  return <CompanyReviewsSectionClient company={company} />;
}
