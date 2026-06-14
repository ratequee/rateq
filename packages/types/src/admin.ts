import type { CompanyPublic } from './company';
import type { CompanyVerificationStatus } from './onboarding';
import type { PaginatedResponse } from './pagination';
import type { ReviewPublic } from './review';
import type { UserProfile } from './user';

export interface AdminDailyActivityPoint {
  date: string;
  reviewCount: number;
  companiesCount: number;
  reviewersCount: number;
}

export interface AdminPlatformStats {
  totalCompanies: number;
  totalReviewers: number;
  totalReviews: number;
  pendingReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
  resolutionPendingReviews: number;
  dailyActivity: AdminDailyActivityPoint[];
  topCompanies: Array<{
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    reviewCount: number;
    ratingAverage: number;
  }>;
  topReviewers: Array<{ id: string; name: string; email: string; reviewCount: number }>;
  latestReviews: ReviewPublic[];
}

export interface AdminCompanyOwner {
  id: string;
  email: string;
}

export interface AdminCompanyVerificationSummary {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  country: string;
  city: string;
  reviewCount: number;
  pageVisitCount: number;
  verificationStatus: CompanyVerificationStatus;
  createdAt: string;
  owner: AdminCompanyOwner | null;
}

export interface AdminCompanyVerificationDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  coverUrl: string | null;
  address: string | null;
  crNumber: string | null;
  validationDate: string | null;
  registrationDocUrl: string | null;
  establishmentCardUrl: string | null;
  tradeLicenseUrl: string | null;
  country: string;
  city: string;
  reviewCount: number;
  pageVisitCount: number;
  verificationStatus: CompanyVerificationStatus;
  revisionNotes: string | null;
  createdAt: string;
  updatedAt: string;
  owner: AdminCompanyOwner | null;
}

export type PaginatedAdminCompanyVerifications = PaginatedResponse<AdminCompanyVerificationSummary>;

export interface UpdateCompanyVerificationInput {
  status: 'approved' | 'rejected' | 'revision_requested';
  revisionNotes?: string;
}

export interface AdminCompanyListItem extends CompanyPublic {
  verificationStatus: string;
  ownerEmail: string | null;
  ownerId: string | null;
  ownerIsActive: boolean | null;
  pageVisitCount: number;
}

export interface AdminUserDetail extends UserProfile {
  reviews: ReviewPublic[];
}

export interface AdminCompanyDetail extends AdminCompanyListItem {
  reviews: ReviewPublic[];
}
