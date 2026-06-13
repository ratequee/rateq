import type { OnboardingStatus } from '@rateq/types';

export type AccountType = 'reviewer' | 'company';

export type CompanyVerificationStatus = 'pending' | 'approved' | 'rejected' | 'revision_requested';

export interface ReviewerProfileData {
  fullName: string;
  phone: string;
  city: string;
  country: string;
  bio: string;
  avatarFileName: string;
  avatarUrl?: string;
}

export interface CompanyProfileData {
  name: string;
  address: string;
  crNumber: string;
  validationDate: string;
  registrationFileName: string;
  establishmentCardFileName: string;
  tradeLicenseFileName: string;
  logoFileName: string;
  coverFileName: string;
  logoUrl?: string;
  coverUrl?: string;
  registrationDocUrl?: string;
  establishmentCardUrl?: string;
  tradeLicenseUrl?: string;
}

export interface StoredUserProfile {
  userId: string;
  accountType: AccountType;
  isComplete: boolean;
  companyVerificationStatus?: CompanyVerificationStatus;
  reviewer?: ReviewerProfileData;
  company?: CompanyProfileData;
}

const PROFILE_KEY = 'rateq_user_profile';

export function getStoredProfile(): StoredUserProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUserProfile;
  } catch {
    return null;
  }
}

export function saveStoredProfile(profile: StoredUserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function clearStoredProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
}

export function syncStoredProfileFromOnboarding(userId: string, status: OnboardingStatus): void {
  if (!status.isProfileComplete || !status.accountType) {
    clearStoredProfile();
    return;
  }

  if (status.accountType === 'reviewer' && status.reviewerProfile) {
    saveStoredProfile({
      userId,
      accountType: 'reviewer',
      isComplete: true,
      reviewer: {
        fullName: status.reviewerProfile.fullName,
        phone: status.reviewerProfile.phone,
        city: status.reviewerProfile.city,
        country: status.reviewerProfile.country,
        bio: status.reviewerProfile.bio,
        avatarFileName: 'avatar',
        avatarUrl: status.reviewerProfile.avatarUrl ?? undefined,
      },
    });
    return;
  }

  if (status.accountType === 'company' && status.company) {
    saveStoredProfile({
      userId,
      accountType: 'company',
      isComplete: true,
      companyVerificationStatus: status.company.verificationStatus,
      company: {
        name: status.company.name,
        address: status.company.address ?? '',
        crNumber: status.company.crNumber ?? '',
        validationDate: status.company.validationDate ?? '',
        registrationFileName: 'registration',
        establishmentCardFileName: 'establishment-card',
        tradeLicenseFileName: 'trade-license',
        logoFileName: 'logo',
        coverFileName: 'cover',
        logoUrl: status.company.logo ?? undefined,
        coverUrl: status.company.coverUrl ?? undefined,
        registrationDocUrl: status.company.registrationDocUrl ?? undefined,
        establishmentCardUrl: status.company.establishmentCardUrl ?? undefined,
        tradeLicenseUrl: status.company.tradeLicenseUrl ?? undefined,
      },
    });
  }
}

export function isProfileComplete(userId: string): boolean {
  const profile = getStoredProfile();
  return profile?.userId === userId && profile.isComplete;
}

export function canEditCompanyProfile(
  userId: string,
  onboarding?: import('@rateq/types').OnboardingStatus | null,
): boolean {
  if (onboarding?.company) {
    return onboarding.company.verificationStatus === 'revision_requested';
  }

  const profile = getStoredProfile();
  if (!profile || profile.userId !== userId || profile.accountType !== 'company') return true;
  if (!profile.isComplete) return true;
  return profile.companyVerificationStatus === 'revision_requested';
}
