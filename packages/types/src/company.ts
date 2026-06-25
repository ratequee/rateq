import type { PaginatedResponse } from './pagination';
import type { ReviewPublic } from './review';

export interface CompanyProjectPublic {
  id: string;
  title: string;
  imageUrl: string;
  projectUrl: string;
  sortOrder: number;
}

export interface ReviewRatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface CompanyCatalogLabel {
  id: string;
  label: string;
}

export interface CompanyServiceRatingAggregate {
  catalogItemId: string;
  label: string;
  averageRating: number;
  reviewCount: number;
}

export interface CompanyPublic {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  description: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  logo: string | null;
  coverUrl: string | null;
  email: string | null;
  phone: string | null;
  websiteUrl: string | null;
  services: string[];
  serviceItems: CompanyCatalogLabel[];
  activityItems: CompanyCatalogLabel[];
  serviceRatingAggregates?: CompanyServiceRatingAggregate[];
  yearsEstablished: number | null;
  publicProjectCount: number | null;
  privateProjectCount: number | null;
  projects: CompanyProjectPublic[];
  country: string;
  city: string;
  ratingAverage: number;
  reviewCount: number;
  ratingDistribution: ReviewRatingDistribution;
  createdAt: string;
  categoryId?: string | null;
  categoryName?: string | null;
  categoryNameAr?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CompanyDetail extends CompanyPublic {
  updatedAt: string;
  profileChangeStatus: 'none' | 'pending';
}

export type PaginatedCompaniesResponse = PaginatedResponse<CompanyPublic>;

export interface CompanySearchFilters {
  query?: string;
  country?: string;
  city?: string;
  categoryId?: string;
  minRating?: number;
  sort?: 'rating' | 'reviews' | 'newest' | 'name';
}

export interface CreateCompanyInput {
  name: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  description?: string;
  logo: string;
  coverUrl: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  categoryId: string;
  crNumber: string;
  validationDate: string;
  registrationDocUrl: string;
  establishmentCardUrl: string;
  tradeLicenseUrl: string;
  country: string;
  city: string;
  serviceIds?: string[];
  activityIds?: string[];
  yearsEstablished?: number;
  publicProjectCount?: number;
  privateProjectCount?: number;
}

export interface UpdateCompanyProjectInput {
  title: string;
  imageUrl: string;
  projectUrl: string;
}

export interface UpdateCompanyInput {
  name?: string;
  nameAr?: string;
  description?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  websiteUrl?: string | null;
  services?: string[];
  serviceIds?: string[];
  activityIds?: string[];
  yearsEstablished?: number;
  publicProjectCount?: number;
  privateProjectCount?: number;
  projects?: UpdateCompanyProjectInput[];
  logo?: string | null;
  coverUrl?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  categoryId?: string;
  crNumber?: string;
  validationDate?: string;
  registrationDocUrl?: string;
  establishmentCardUrl?: string;
  tradeLicenseUrl?: string;
  country?: string;
  city?: string;
}

export interface CompanyDashboardStats {
  totalReviews: number;
  pendingReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
  averageRating: number;
  monthlyPageVisits: number;
}

export interface CompanyDailyActivityPoint {
  date: string;
  reviewCount: number;
  pageVisits: number;
}

export interface CompanyTopReviewer {
  id: string;
  name: string;
  email: string;
  reviewCount: number;
  ratingAverage: number;
  avatarUrl: string | null;
}

export interface CompanyDashboard {
  company: CompanyDetail;
  stats: CompanyDashboardStats;
  dailyActivity: CompanyDailyActivityPoint[];
  topReviewers: CompanyTopReviewer[];
  latestReviews: ReviewPublic[];
}
