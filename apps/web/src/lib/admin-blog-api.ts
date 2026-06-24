import type {
  BlogPostAdmin,
  CreateBlogPostInput,
  PaginatedBlogPostsAdminResponse,
  UpdateBlogPostInput,
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

export const adminBlogApi = {
  list: async (params?: { status?: 'draft' | 'published'; page?: number; limit?: number }) => {
    const search = new URLSearchParams();
    if (params?.status) search.set('status', params.status);
    search.set('page', String(params?.page ?? 1));
    search.set('limit', String(params?.limit ?? 20));
    return apiClient<PaginatedBlogPostsAdminResponse>(`/admin/blog?${search}`, {
      token: await token(),
    });
  },

  getById: async (id: string) =>
    apiClient<BlogPostAdmin>(`/admin/blog/${id}`, { token: await token() }),

  create: async (data: CreateBlogPostInput) =>
    apiClient<BlogPostAdmin>('/admin/blog', {
      method: 'POST',
      body: JSON.stringify(data),
      token: await token(),
    }),

  update: async (id: string, data: UpdateBlogPostInput) =>
    apiClient<BlogPostAdmin>(`/admin/blog/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token: await token(),
    }),

  remove: async (id: string) =>
    apiClient<{ message: string }>(`/admin/blog/${id}`, {
      method: 'DELETE',
      token: await token(),
    }),
};
