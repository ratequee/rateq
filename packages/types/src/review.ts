import type { ReviewStatus } from './enums';
import type { PaginatedResponse } from './pagination';

export interface ReviewAuthor {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface ReviewServiceRatingPublic {
  categoryServiceId: string;
  serviceName: string;
  rating: number;
}

export interface ReviewAttachmentPublic {
  id: string;
  url: string;
  fileName: string | null;
}

export interface ReviewCompanySummary {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
}

export interface ReviewPublic {
  id: string;
  companyId: string;
  userId: string;
  rating: number;
  title: string;
  content: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  author?: ReviewAuthor;
  company?: ReviewCompanySummary;
  reply?: ReviewReplyPublic | null;
  serviceRatings?: ReviewServiceRatingPublic[];
  attachments?: ReviewAttachmentPublic[];
}

export interface ReviewReplyPublic {
  id: string;
  content: string;
  createdAt: string;
}

export interface ReviewServiceRatingInput {
  categoryServiceId: string;
  rating: number;
}

export interface CreateReviewInput {
  companyId: string;
  rating?: number;
  title: string;
  content: string;
  deviceFingerprint?: string;
  serviceRatings?: ReviewServiceRatingInput[];
  proofUrls?: string[];
}

export interface ModerationScoreBreakdown {
  newAccount: number;
  velocity: number;
  ipHash: number;
  fingerprint: number;
  similarity: number;
  total: number;
}

export type PaginatedReviewsResponse = PaginatedResponse<ReviewPublic>;
