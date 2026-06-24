import type { PaginatedResponse } from './pagination';

export type BlogLocale = 'en' | 'ar';
export type BlogPostStatus = 'draft' | 'published';

export interface BlogPostTranslationPublic {
  locale: BlogLocale;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface BlogPostPublic {
  id: string;
  status: BlogPostStatus;
  coverUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  translation: BlogPostTranslationPublic;
}

export interface BlogPostAdmin {
  id: string;
  status: BlogPostStatus;
  coverUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  translations: BlogPostTranslationPublic[];
}

export interface BlogPostTranslationInput {
  locale: BlogLocale;
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface CreateBlogPostInput {
  status?: BlogPostStatus;
  coverUrl?: string | null;
  publishedAt?: string | null;
  translations: BlogPostTranslationInput[];
}

export interface UpdateBlogPostInput {
  status?: BlogPostStatus;
  coverUrl?: string | null;
  publishedAt?: string | null;
  translations?: BlogPostTranslationInput[];
}

export type PaginatedBlogPostsResponse = PaginatedResponse<BlogPostPublic>;
export type PaginatedBlogPostsAdminResponse = PaginatedResponse<BlogPostAdmin>;
