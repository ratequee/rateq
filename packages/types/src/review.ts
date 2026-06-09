import type { ReviewStatus } from './enums';
import type { PaginatedResponse } from './pagination';

export interface ReviewAuthor {
  id: string;
  displayName: string;
  avatarUrl: string | null;
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
  reply?: ReviewReplyPublic | null;
}

export interface ReviewReplyPublic {
  id: string;
  content: string;
  createdAt: string;
}

export interface CreateReviewInput {
  companyId: string;
  rating: number;
  title: string;
  content: string;
  deviceFingerprint?: string;
}

export interface ModerationScoreBreakdown {
  newAccount: number;
  velocity: number;
  fingerprint: number;
  similarity: number;
  total: number;
}

export type PaginatedReviewsResponse = PaginatedResponse<ReviewPublic>;
