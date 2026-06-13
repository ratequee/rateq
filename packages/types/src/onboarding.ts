import type { CompanyDetail } from './company';

export type AccountType = 'reviewer' | 'company';

export type CompanyVerificationStatus = 'pending' | 'approved' | 'rejected' | 'revision_requested';

export interface ReviewerProfile {
  fullName: string;
  phone: string;
  city: string;
  country: string;
  bio: string;
  avatarUrl: string | null;
}

export interface CompleteReviewerProfileInput {
  fullName: string;
  phone: string;
  city: string;
  country: string;
  bio?: string;
  avatarUrl: string;
}

export interface CompanyProfileDetail extends CompanyDetail {
  address: string | null;
  phone: string | null;
  crNumber: string | null;
  validationDate: string | null;
  registrationDocUrl: string | null;
  establishmentCardUrl: string | null;
  tradeLicenseUrl: string | null;
  coverUrl: string | null;
  verificationStatus: CompanyVerificationStatus;
  revisionNotes: string | null;
}

export interface OnboardingStatus {
  isProfileComplete: boolean;
  accountType: AccountType | null;
  reviewerProfile: ReviewerProfile | null;
  company: CompanyProfileDetail | null;
}
