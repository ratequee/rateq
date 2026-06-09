import type {
  AdminCompanyVerificationDetail,
  CategoryPublic,
  CreateCategoryInput,
  PaginatedAdminCompanyVerifications,
  UpdateCompanyVerificationInput,
} from '@rateq/types';
import { apiClient } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';

async function token(): Promise<string> {
  const accessToken = await ensureValidAccessToken();
  if (!accessToken) {
    throw new Error('Session expired. Please log in again.');
  }
  return accessToken;
}

export const adminApi = {
  getFirebaseAdminAccess: async () =>
    apiClient<{ allowed: boolean }>('/auth/firebase-admin-access', { token: await token() }),

  listCompanyVerifications: async (params: {
    status?: 'pending' | 'approved' | 'rejected';
    page?: number;
    limit?: number;
  }) => {
    const search = new URLSearchParams();
    if (params.status) search.set('status', params.status);
    search.set('page', String(params.page ?? 1));
    search.set('limit', String(params.limit ?? 20));
    return apiClient<PaginatedAdminCompanyVerifications>(
      `/admin/companies/verifications?${search}`,
      { token: await token() },
    );
  },

  getCompanyVerification: async (id: string) =>
    apiClient<AdminCompanyVerificationDetail>(`/admin/companies/verifications/${id}`, {
      token: await token(),
    }),

  updateCompanyVerification: async (id: string, data: UpdateCompanyVerificationInput) =>
    apiClient<AdminCompanyVerificationDetail>(`/admin/companies/verifications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token: await token(),
    }),

  createCategory: async (data: CreateCategoryInput) =>
    apiClient<CategoryPublic>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
      token: await token(),
    }),

  removeCategory: async (id: string) =>
    apiClient<{ message: string }>(`/admin/categories/${id}`, {
      method: 'DELETE',
      token: await token(),
    }),
};
