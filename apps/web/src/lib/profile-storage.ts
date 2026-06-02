export type AccountType = 'reviewer' | 'company';

export type CompanyVerificationStatus = 'pending' | 'approved' | 'rejected';

export interface ReviewerProfileData {
  fullName: string;
  phone: string;
  city: string;
  country: string;
  bio: string;
  avatarFileName: string;
}

export interface CompanyProfileData {
  name: string;
  address: string;
  crNumber: string;
  validationDate: string;
  registrationFileName: string;
  logoFileName: string;
  coverFileName: string;
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

export function isProfileComplete(userId: string): boolean {
  const profile = getStoredProfile();
  return profile?.userId === userId && profile.isComplete;
}

export function canEditCompanyProfile(userId: string): boolean {
  const profile = getStoredProfile();
  if (!profile || profile.userId !== userId || profile.accountType !== 'company') return true;
  if (!profile.isComplete) return true;
  return profile.companyVerificationStatus === 'rejected';
}
