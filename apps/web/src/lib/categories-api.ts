import type { CategoriesListResponse, CategoryPublic, CreateCategoryInput } from '@rateq/types';
import { apiClient, apiServer } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';

export async function fetchCategories(): Promise<CategoriesListResponse> {
  try {
    return await apiServer<CategoriesListResponse>('/categories');
  } catch {
    return [];
  }
}

export async function fetchCategoryBySlug(slug: string): Promise<CategoryPublic | null> {
  try {
    return await apiServer<CategoryPublic>(`/categories/${slug}`);
  } catch {
    return null;
  }
}

export async function fetchCategoriesClient(): Promise<CategoriesListResponse> {
  try {
    return await apiClient<CategoriesListResponse>('/categories', { token: null });
  } catch {
    return [];
  }
}

async function adminToken(): Promise<string> {
  const accessToken = await ensureValidAccessToken();
  if (!accessToken) {
    throw new Error('Session expired. Please log in again.');
  }
  return accessToken;
}

export const categoriesApi = {
  list: fetchCategories,
  listClient: fetchCategoriesClient,

  getBySlug: (slug: string) => apiServer<CategoryPublic>(`/categories/${slug}`),

  create: async (data: CreateCategoryInput) =>
    apiClient<CategoryPublic>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
      token: await adminToken(),
    }),

  remove: async (id: string) =>
    apiClient<{ message: string }>(`/admin/categories/${id}`, {
      method: 'DELETE',
      token: await adminToken(),
    }),
};
