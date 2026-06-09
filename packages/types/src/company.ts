import type { PaginatedResponse } from './pagination';

export interface CompanyPublic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  coverUrl: string | null;
  email: string | null;
  phone: string | null;
  country: string;
  city: string;
  ratingAverage: number;
  reviewCount: number;
  createdAt: string;
  categoryId?: string | null;
  categoryName?: string | null;
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
  phone: string;
  categoryId: string;
  crNumber: string;
  validationDate: string;
  registrationDocUrl: string;
  country: string;
  city: string;
}

export interface UpdateCompanyInput {
  name?: string;
  description?: string;
  logo?: string | null;
  coverUrl?: string;
  address?: string;
  phone?: string;
  categoryId?: string;
  crNumber?: string;
  validationDate?: string;
  registrationDocUrl?: string;
  country?: string;
  city?: string;
}

export interface CompanyDashboardStats {
  totalReviews: number;
  pendingReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
  averageRating: number;
}

export interface CompanyDashboard {
  company: CompanyDetail;
  stats: CompanyDashboardStats;
}
