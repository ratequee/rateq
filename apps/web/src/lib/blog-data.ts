import type { BlogLocale, PaginatedBlogPostsResponse, BlogPostPublic } from '@rateq/types';
import { apiServer } from '@/lib/api';

const EMPTY_META = {
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

export async function fetchBlogPosts(
  locale: BlogLocale,
  limit = 12,
  page = 1,
): Promise<PaginatedBlogPostsResponse> {
  try {
    const params = new URLSearchParams({
      locale,
      limit: String(limit),
      page: String(page),
    });
    return await apiServer<PaginatedBlogPostsResponse>(`/blog?${params}`);
  } catch {
    return { data: [], meta: { ...EMPTY_META, limit } };
  }
}

export async function fetchBlogPostBySlug(
  locale: BlogLocale,
  slug: string,
): Promise<BlogPostPublic | null> {
  try {
    const params = new URLSearchParams({ locale });
    return await apiServer<BlogPostPublic>(`/blog/${encodeURIComponent(slug)}?${params}`);
  } catch {
    return null;
  }
}
