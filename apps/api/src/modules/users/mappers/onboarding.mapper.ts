import type { Company, CompanyVerificationStatus, UserProfile } from '@prisma/client';
import type {
  AccountType,
  CompanyCatalogLabel,
  CompanyProfileDetail,
  CompanyVerificationStatus as ApiCompanyVerificationStatus,
  OnboardingStatus,
  ReviewerProfile,
} from '@rateq/types';
import { toCompanyDetail } from '../../companies/mappers/company.mapper';

function toApiVerificationStatus(status: CompanyVerificationStatus): ApiCompanyVerificationStatus {
  return status.toLowerCase() as ApiCompanyVerificationStatus;
}

export function toReviewerProfile(profile: UserProfile): ReviewerProfile {
  return {
    fullName: profile.fullName,
    phone: profile.phone,
    city: profile.city,
    country: profile.country,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
  };
}

export function toCompanyProfileDetail(
  company: Company,
  extras?: {
    serviceItems?: CompanyCatalogLabel[];
    activityItems?: CompanyCatalogLabel[];
  },
): CompanyProfileDetail {
  return {
    ...toCompanyDetail(company, extras),
    address: company.address,
    phone: company.phone,
    crNumber: company.crNumber,
    validationDate: company.validationDate?.toISOString() ?? null,
    registrationDocUrl: company.registrationDocUrl,
    establishmentCardUrl: company.establishmentCardUrl,
    tradeLicenseUrl: company.tradeLicenseUrl,
    coverUrl: company.coverUrl,
    verificationStatus: toApiVerificationStatus(company.verificationStatus),
    revisionNotes: company.revisionNotes,
  };
}

export function buildOnboardingStatus(input: {
  reviewerProfile: UserProfile | null;
  company: Company | null;
  companyExtras?: {
    serviceItems?: CompanyCatalogLabel[];
    activityItems?: CompanyCatalogLabel[];
  };
}): OnboardingStatus {
  const { reviewerProfile, company, companyExtras } = input;

  let accountType: AccountType | null = null;
  if (company) {
    accountType = 'company';
  } else if (reviewerProfile) {
    accountType = 'reviewer';
  }

  const isProfileComplete = Boolean(reviewerProfile || company);

  return {
    isProfileComplete,
    accountType,
    reviewerProfile: reviewerProfile ? toReviewerProfile(reviewerProfile) : null,
    company: company ? toCompanyProfileDetail(company, companyExtras) : null,
  };
}
