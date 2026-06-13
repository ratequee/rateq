import type { CompanyVerificationStatus } from './onboarding';
import type { PaginatedResponse } from './pagination';

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
