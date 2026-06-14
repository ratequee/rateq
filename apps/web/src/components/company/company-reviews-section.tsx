import type { CategoryServicePublic, CompanyPublic } from '@rateq/types';
import { CompanyReviewsSectionClient } from '@/components/company/company-reviews-section-client';
import type { JSX } from 'react';

interface CompanyReviewsSectionProps {
  company: CompanyPublic;
  categoryServices?: CategoryServicePublic[];
}

export function CompanyReviewsSection({
  company,
  categoryServices = [],
}: CompanyReviewsSectionProps): JSX.Element {
  return <CompanyReviewsSectionClient company={company} categoryServices={categoryServices} />;
}
