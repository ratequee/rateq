import type { ReviewPublic } from '@rateq/types';

export type DashboardReviewRowStatus = 'pending' | 'approved' | 'rejected' | 'useful';

export interface DashboardReviewRow {
  id: string;
  company: string;
  companyLogoUrl?: string | null;
  user: string;
  userAvatarUrl?: string | null;
  location: string;
  rating: number;
  status: DashboardReviewRowStatus;
}

export function mapReviewStatus(status: string): DashboardReviewRowStatus {
  switch (status) {
    case 'APPROVED':
      return 'approved';
    case 'REJECTED':
      return 'rejected';
    case 'PENDING':
    case 'RESOLUTION_PENDING':
    default:
      return 'pending';
  }
}

export function mapReviewToDashboardRow(review: ReviewPublic): DashboardReviewRow {
  return {
    id: review.id,
    company: review.company?.name ?? '—',
    companyLogoUrl: review.company?.logo ?? null,
    user: review.author?.displayName ?? '—',
    userAvatarUrl: review.author?.avatarUrl ?? null,
    location: '',
    rating: review.rating,
    status: mapReviewStatus(review.status),
  };
}
