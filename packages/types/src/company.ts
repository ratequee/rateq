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

export interface CompanyPublic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  coverUrl: string | null;
  email: string | null;
  phone: string | null;
  websiteUrl: string | null;
  services: string[];
  projects: CompanyProjectPublic[];
  country: string;
  city: string;
  ratingAverage: number;
  reviewCount: number;
  ratingDistribution: ReviewRatingDistribution;
  createdAt: string;
  categoryId?: string | null;
  categoryName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CompanyDetail extends CompanyPublic {
  updatedAt: string;
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
}

export interface UpdateCompanyProjectInput {
  title: string;
  imageUrl: string;
  projectUrl: string;
}

export interface UpdateCompanyInput {
  name?: string;
  description?: string;
  websiteUrl?: string | null;
  services?: string[];
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
