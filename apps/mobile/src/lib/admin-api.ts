import type {
  AdminCompanyDetail,
  AdminCompanyListItem,
  AdminCompanyVerificationDetail,
  AdminPlatformStats,
  AdminUpdateUserInput,
  AdminUserDetail,
  MessageResponse,
  PaginatedAdminCompanyVerifications,
  PaginatedAdminProjectsResponse,
  PaginatedCompaniesResponse,
  PaginatedReviewsResponse,
  PaginatedUsersResponse,
  ReviewerInvitationRequestPublic,
  ReviewPublic,
  UpdateCompanyVerificationInput,
  UserProfile,
} from '@rateq/types';
import { apiClient } from '@/lib/api';

export type AdminCompanyListResponse = PaginatedCompaniesResponse & {
  data: AdminCompanyListItem[];
};

export type VerificationListStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'revision_requested'
  | 'profile_changes';

export const adminApi = {
  getAdminAccess: () =>
    apiClient<{ allowed: boolean; permissions: string[] }>('/auth/admin-access'),

  getStats: () => apiClient<AdminPlatformStats>('/admin/stats'),

  listCompanyVerifications: (params: {
    status?: VerificationListStatus;
    page?: number;
    limit?: number;
  }) => {
    const search = new URLSearchParams();
    if (params.status) search.set('status', params.status);
    search.set('page', String(params.page ?? 1));
    search.set('limit', String(params.limit ?? 20));
    return apiClient<PaginatedAdminCompanyVerifications>(
      `/admin/companies/verifications?${search}`,
    );
  },

  getCompanyVerification: (id: string) =>
    apiClient<AdminCompanyVerificationDetail>(`/admin/companies/verifications/${id}`),

  updateCompanyVerification: (id: string, data: UpdateCompanyVerificationInput) =>
    apiClient<AdminCompanyVerificationDetail>(`/admin/companies/verifications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  approveProfileChanges: (companyId: string) =>
    apiClient(`/admin/companies/${companyId}/profile-changes/approve`, { method: 'PATCH' }),

  rejectProfileChanges: (companyId: string) =>
    apiClient(`/admin/companies/${companyId}/profile-changes/reject`, { method: 'PATCH' }),

  listDirectoryCompanies: (params?: { page?: number; limit?: number; search?: string }) => {
    const search = new URLSearchParams();
    search.set('page', String(params?.page ?? 1));
    search.set('limit', String(params?.limit ?? 20));
    if (params?.search?.trim()) search.set('search', params.search.trim());
    return apiClient<AdminCompanyListResponse>(`/admin/companies?${search}`);
  },

  listDirectoryReviewers: (params?: { page?: number; limit?: number; search?: string }) => {
    const search = new URLSearchParams({
      role: 'USER',
      excludeAdmins: 'true',
      ownsCompany: '0',
      page: String(params?.page ?? 1),
      limit: String(params?.limit ?? 20),
    });
    if (params?.search?.trim()) search.set('search', params.search.trim());
    return apiClient<PaginatedUsersResponse>(`/users?${search}`);
  },

  getCompanyDetail: (companyId: string) =>
    apiClient<AdminCompanyDetail>(`/admin/companies/${companyId}/detail`),

  getUserDetail: (userId: string) => apiClient<AdminUserDetail>(`/admin/users/${userId}/detail`),

  updateUser: (userId: string, data: AdminUpdateUserInput) =>
    apiClient<UserProfile>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteUser: (userId: string) =>
    apiClient<MessageResponse>(`/users/${userId}`, { method: 'DELETE' }),

  deleteCompany: (companyId: string) =>
    apiClient<MessageResponse>(`/admin/companies/${companyId}`, { method: 'DELETE' }),

  updateCompanyStamp: (companyId: string, showVerifiedStamp: boolean) =>
    apiClient<AdminCompanyDetail>(`/admin/companies/${companyId}/stamp`, {
      method: 'PATCH',
      body: JSON.stringify({ showVerifiedStamp }),
    }),

  updateCompanyTrusted: (companyId: string, isTrusted: boolean) =>
    apiClient<AdminCompanyDetail>(`/admin/companies/${companyId}/trusted`, {
      method: 'PATCH',
      body: JSON.stringify({ isTrusted }),
    }),

  listModerationReviews: (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const search = new URLSearchParams();
    search.set('page', String(params?.page ?? 1));
    search.set('limit', String(params?.limit ?? 20));
    if (params?.status) search.set('status', params.status);
    if (params?.search?.trim()) search.set('search', params.search.trim());
    return apiClient<PaginatedReviewsResponse>(`/moderation/reviews?${search}`);
  },

  approveReview: (id: string) =>
    apiClient<MessageResponse>(`/moderation/reviews/${id}/approve`, { method: 'PATCH' }),

  rejectReview: (id: string) =>
    apiClient<MessageResponse>(`/moderation/reviews/${id}/reject`, { method: 'PATCH' }),

  resolveReview: (id: string) =>
    apiClient<MessageResponse>(`/moderation/reviews/${id}/resolve`, { method: 'PATCH' }),

  deleteReview: (id: string) =>
    apiClient<MessageResponse>(`/moderation/reviews/${id}`, { method: 'DELETE' }),

  deleteReviewReply: (reviewId: string) =>
    apiClient<MessageResponse>(`/moderation/reviews/${reviewId}/reply`, {
      method: 'DELETE',
    }),

  approveReviewReply: (reviewId: string) =>
    apiClient<MessageResponse>(`/moderation/reviews/${reviewId}/reply/approve`, {
      method: 'PATCH',
    }),

  rejectReviewReply: (reviewId: string) =>
    apiClient<MessageResponse>(`/moderation/reviews/${reviewId}/reply/reject`, {
      method: 'PATCH',
    }),

  listModerationProjects: (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const search = new URLSearchParams();
    search.set('page', String(params?.page ?? 1));
    search.set('limit', String(params?.limit ?? 20));
    if (params?.status) search.set('status', params.status);
    if (params?.search?.trim()) search.set('search', params.search.trim());
    return apiClient<PaginatedAdminProjectsResponse>(`/moderation/projects?${search}`);
  },

  approveProject: (id: string) =>
    apiClient<MessageResponse>(`/moderation/projects/${id}/approve`, { method: 'PATCH' }),

  rejectProject: (id: string) =>
    apiClient<MessageResponse>(`/moderation/projects/${id}/reject`, { method: 'PATCH' }),

  deleteProject: (id: string) =>
    apiClient<MessageResponse>(`/moderation/projects/${id}`, { method: 'DELETE' }),

  listReviewerInvitationRequests: () =>
    apiClient<ReviewerInvitationRequestPublic[]>('/admin/reviewer-invitation-requests'),

  approveReviewerInvitationRequest: (id: string) =>
    apiClient<ReviewerInvitationRequestPublic>(
      `/admin/reviewer-invitation-requests/${id}/approve`,
      { method: 'PATCH' },
    ),

  rejectReviewerInvitationRequest: (id: string) =>
    apiClient<ReviewerInvitationRequestPublic>(`/admin/reviewer-invitation-requests/${id}/reject`, {
      method: 'PATCH',
    }),

  deleteReviewerInvitationRequest: (id: string) =>
    apiClient<ReviewerInvitationRequestPublic>(`/admin/reviewer-invitation-requests/${id}`, {
      method: 'DELETE',
    }),
};

export type { ReviewPublic };
