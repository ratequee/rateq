export interface LegalDocumentPoint {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
}

export interface SiteSettingsPublic {
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  youtubeUrl: string | null;
  linkedinUrl: string | null;
  aboutTextEn: string | null;
  aboutTextAr: string | null;
  privacyPolicyEn: LegalDocumentPoint[] | null;
  privacyPolicyAr: LegalDocumentPoint[] | null;
  termsOfServiceEn: LegalDocumentPoint[] | null;
  termsOfServiceAr: LegalDocumentPoint[] | null;
}

export interface UpdateSiteSettingsInput {
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  twitterUrl?: string | null;
  youtubeUrl?: string | null;
  linkedinUrl?: string | null;
  aboutTextEn?: string | null;
  aboutTextAr?: string | null;
  privacyPolicyEn?: LegalDocumentPoint[] | null;
  privacyPolicyAr?: LegalDocumentPoint[] | null;
  termsOfServiceEn?: LegalDocumentPoint[] | null;
  termsOfServiceAr?: LegalDocumentPoint[] | null;
}

export interface PlatformStats {
  totalCompanies: number;
  totalReviewers: number;
  totalReviews: number;
}
