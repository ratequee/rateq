import type { PaginatedResponse } from './pagination';
import type { ReviewPublic } from './review';

export type ReviewReportStatus = 'pending' | 'approved' | 'rejected';

export interface ReviewReportPublic {
  id: string;
  reviewId: string;
  reporterId: string;
  reason: string | null;
  status: ReviewReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  review?: ReviewPublic;
  reporterEmail?: string;
}

export interface CreateReviewReportInput {
  reason?: string;
}

export type PaginatedReviewReportsResponse = PaginatedResponse<ReviewReportPublic>;
