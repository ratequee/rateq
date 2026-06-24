import type {
  AdminCompanyVerificationDetail,
  CategoryPublic,
  CategoryServicePublic,
  CompanyCatalogItemPublic,
  CompanyDetail,
  CreateCategoryInput,
  CreateCategoryServiceInput,
  CreateCompanyCatalogItemInput,
  InvitationPublic,
  PaginatedAdminCompanyVerifications,
  SendInvitationInput,
  UpdateCompanyCatalogItemInput,
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
    status?: 'pending' | 'approved' | 'rejected' | 'revision_requested';
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

  addCategoryService: async (categoryId: string, data: CreateCategoryServiceInput) =>
    apiClient<CategoryServicePublic>(`/admin/categories/${categoryId}/services`, {
      method: 'POST',
      body: JSON.stringify(data),
      token: await token(),
    }),

  removeCategoryService: async (categoryId: string, serviceId: string) =>
    apiClient<{ message: string }>(`/admin/categories/${categoryId}/services/${serviceId}`, {
      method: 'DELETE',
      token: await token(),
    }),

  listCompanyCatalog: async (type?: 'service' | 'activity') => {
    const search = type ? `?type=${type}` : '';
    return apiClient<CompanyCatalogItemPublic[]>(`/admin/company-catalog${search}`, {
      token: await token(),
    });
  },

  createCompanyCatalogItem: async (data: CreateCompanyCatalogItemInput) =>
    apiClient<CompanyCatalogItemPublic>('/admin/company-catalog', {
      method: 'POST',
      body: JSON.stringify(data),
      token: await token(),
    }),

  updateCompanyCatalogItem: async (id: string, data: UpdateCompanyCatalogItemInput) =>
    apiClient<CompanyCatalogItemPublic>(`/admin/company-catalog/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token: await token(),
    }),

  deleteCompanyCatalogItem: async (id: string) =>
    apiClient<{ message: string }>(`/admin/company-catalog/${id}`, {
      method: 'DELETE',
      token: await token(),
    }),

  listProfileChanges: async () =>
    apiClient<CompanyDetail[]>('/admin/companies/profile-changes', { token: await token() }),

  approveProfileChanges: async (companyId: string) =>
    apiClient<CompanyDetail>(`/admin/companies/${companyId}/profile-changes/approve`, {
      method: 'PATCH',
      token: await token(),
    }),

  rejectProfileChanges: async (companyId: string) =>
    apiClient<CompanyDetail>(`/admin/companies/${companyId}/profile-changes/reject`, {
      method: 'PATCH',
      token: await token(),
    }),

  inviteCompany: async (data: SendInvitationInput) =>
    apiClient<InvitationPublic>('/admin/invitations/company', {
      method: 'POST',
      body: JSON.stringify(data),
      token: await token(),
    }),
};
