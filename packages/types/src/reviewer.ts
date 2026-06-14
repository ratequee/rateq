import type { ReviewPublic } from './review';

export interface ReviewerDashboardStats {
  totalReviews: number;
  pendingReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
}

export interface ReviewerDailyActivityPoint {
  date: string;
  reviewCount: number;
  pageVisits: number;
}

export interface ReviewerRecentlyRatedCompany {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  rating: number;
  reviewedAt: string;
}

export interface ReviewerDashboard {
  stats: ReviewerDashboardStats;
  dailyActivity: ReviewerDailyActivityPoint[];
  recentlyRatedCompanies: ReviewerRecentlyRatedCompany[];
  latestReviews: ReviewPublic[];
}
