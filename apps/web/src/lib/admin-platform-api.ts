import type {
  AdminCompanyDetail,
  AdminCompanyListItem,
  AdminPermission,
  AdminPlatformStats,
  AdminUserDetail,
  MessageResponse,
  PaginatedAdminActivityResponse,
  PaginatedCompaniesResponse,
  UserProfile,
} from '@rateq/types';
import { apiClient } from '@/lib/api';

export type AdminCompanyListResponse = PaginatedCompaniesResponse & {
  data: AdminCompanyListItem[];
};

export const adminApi = {
  getStats: (token: string) => apiClient<AdminPlatformStats>('/admin/stats', { token }),

  listCompanies: (token: string, params?: URLSearchParams) =>
    apiClient<AdminCompanyListResponse>(`/admin/companies${params ? `?${params}` : ''}`, {
      token,
    }),

  getUserDetail: (token: string, userId: string) =>
    apiClient<AdminUserDetail>(`/admin/users/${userId}/detail`, { token }),

  getCompanyDetail: (token: string, companyId: string) =>
    apiClient<AdminCompanyDetail>(`/admin/companies/${companyId}/detail`, { token }),

  updateUser: (
    token: string,
    userId: string,
    data: {
      isActive?: boolean;
      isVerified?: boolean;
      role?: import('@rateq/types').UserRole;
      adminPermissions?: AdminPermission[];
    },
  ) =>
    apiClient<UserProfile>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),

  listTeam: (token: string) => apiClient<UserProfile[]>('/admin/team', { token }),

  listActivity: (token: string, page = 1, limit = 20) =>
    apiClient<PaginatedAdminActivityResponse>(`/admin/activity?page=${page}&limit=${limit}`, {
      token,
    }),

  deleteUser: (token: string, userId: string) =>
    apiClient<MessageResponse>(`/users/${userId}`, { method: 'DELETE', token }),

  deleteCompany: (token: string, companyId: string) =>
    apiClient<MessageResponse>(`/companies/${companyId}`, { method: 'DELETE', token }),

  deleteReviewReply: (token: string, reviewId: string) =>
    apiClient<MessageResponse>(`/moderation/reviews/${reviewId}/reply`, {
      method: 'DELETE',
      token,
    }),
};
