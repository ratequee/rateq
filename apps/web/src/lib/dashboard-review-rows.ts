import type { ReviewPublic } from '@rateq/types';

export type DashboardReviewRowStatus =
  | 'pending'
  | 'resolution_pending'
  | 'modified'
  | 'proceeded'
  | 'withdrawn'
  | 'approved'
  | 'rejected'
  | 'deleted'
  | 'useful';

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
    case 'WITHDRAWN':
      return 'withdrawn';
    case 'DELETED':
      return 'deleted';
    case 'RESOLUTION_PENDING':
      return 'resolution_pending';
    case 'MODIFIED':
      return 'modified';
    case 'PROCEEDED':
      return 'proceeded';
    case 'PENDING':
      return 'pending';
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
