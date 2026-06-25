import type { Company, CompanyVerificationStatus, User } from '@prisma/client';
import type {
  AdminCompanyOwner,
  AdminCompanyVerificationDetail,
  AdminCompanyVerificationSummary,
  CompanyVerificationStatus as ApiStatus,
} from '@rateq/types';

function toApiStatus(status: CompanyVerificationStatus): ApiStatus {
  return status.toLowerCase() as ApiStatus;
}

function toOwner(owner: Pick<User, 'id' | 'email'> | null): AdminCompanyOwner | null {
  if (!owner) return null;
  return { id: owner.id, email: owner.email };
}

type CompanyWithOwner = Company & {
  owner: Pick<User, 'id' | 'email'> | null;
  _count: { pageViews: number };
};

export function toAdminCompanyVerificationSummary(
  company: CompanyWithOwner,
): AdminCompanyVerificationSummary {
  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    logo: company.logo,
    country: company.country,
    city: company.city,
    reviewCount: company.reviewCount,
    pageVisitCount: company._count.pageViews,
    verificationStatus: toApiStatus(company.verificationStatus),
    profileChangeStatus: company.profileChangeStatus === 'PENDING' ? 'pending' : 'none',
    createdAt: company.createdAt.toISOString(),
    owner: toOwner(company.owner),
  };
}

export function toAdminCompanyVerificationDetail(
  company: CompanyWithOwner,
): AdminCompanyVerificationDetail {
  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    description: company.description,
    logo: company.logo,
    coverUrl: company.coverUrl,
    address: company.address,
    crNumber: company.crNumber,
    validationDate: company.validationDate?.toISOString() ?? null,
    registrationDocUrl: company.registrationDocUrl,
    establishmentCardUrl: company.establishmentCardUrl,
    tradeLicenseUrl: company.tradeLicenseUrl,
    country: company.country,
    city: company.city,
    reviewCount: company.reviewCount,
    pageVisitCount: company._count.pageViews,
    verificationStatus: toApiStatus(company.verificationStatus),
    profileChangeStatus: company.profileChangeStatus === 'PENDING' ? 'pending' : 'none',
    revisionNotes: company.revisionNotes,
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
    owner: toOwner(company.owner),
  };
}
