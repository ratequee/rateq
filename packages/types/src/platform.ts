export interface SiteSettingsPublic {
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  youtubeUrl: string | null;
  linkedinUrl: string | null;
  aboutTextEn: string | null;
  aboutTextAr: string | null;
}

export interface UpdateSiteSettingsInput {
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  facebookUrl?: string | null;
  twitterUrl?: string | null;
  youtubeUrl?: string | null;
  linkedinUrl?: string | null;
  aboutTextEn?: string | null;
  aboutTextAr?: string | null;
}

export interface PlatformStats {
  totalCompanies: number;
  totalReviewers: number;
  totalReviews: number;
}
