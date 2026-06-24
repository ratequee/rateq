import type {
  AuthResponse,
  AuthenticatedUser,
  AuthTokens,
  CompanyDashboard,
  CompanyPublic,
  CreateReviewInput,
  PaginatedCompaniesResponse,
  PaginatedReviewsResponse,
  PaginatedUsersResponse,
  PlatformStats,
  ReviewPublic,
  UserProfile,
} from '@rateq/types';
import type { MessageResponse } from '@rateq/types';
import { refreshAccessToken } from '@/lib/auth-session';
import { getRefreshToken } from '@/lib/auth-storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiEnvelope<T> {
  data: T;
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('rateq_access_token');
}

export async function apiClient<T>(
  path: string,
  options: RequestInit & { token?: string | null; unwrap?: boolean } = {},
): Promise<T> {
  const { token = getStoredToken(), unwrap = true, ...init } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (
    response.status === 401 &&
    token &&
    getRefreshToken() &&
    !path.includes('/auth/refresh') &&
    !path.includes('/auth/firebase')
  ) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${newAccessToken}`;
      response = await fetch(`${API_URL}${path}`, {
        ...init,
        headers,
        cache: 'no-store',
      });
    }
  }

  const body = (await response.json()) as ApiEnvelope<T> | { message: string; statusCode: number };

  if (!response.ok) {
    const err = body as { message: string; statusCode: number; errors?: Record<string, string[]> };
    throw new ApiError(
      err.message ?? 'Request failed',
      err.statusCode ?? response.status,
      err.errors,
    );
  }

  if (unwrap && body && typeof body === 'object' && 'data' in body) {
    return (body as ApiEnvelope<T>).data;
  }

  return body as T;
}

export async function apiServer<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const body = (await response.json()) as ApiEnvelope<T>;
  return body.data;
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      token: null,
    }),
  register: (data: { email: string; password: string; role?: string }) =>
    apiClient<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      token: null,
    }),
  me: (token: string) => apiClient<AuthenticatedUser>('/auth/me', { token }),
  refresh: (refreshToken: string) =>
    apiClient<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      token: null,
    }),
  forgotPassword: (email: string) =>
    apiClient<MessageResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      token: null,
    }),
  firebaseLogin: (idToken: string) =>
    apiClient<AuthResponse>('/auth/firebase', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
      token: null,
    }),
  logout: (token: string) =>
    apiClient<MessageResponse>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
      token,
    }),
  firebaseAdminAccess: (token: string) =>
    apiClient<{ allowed: boolean }>('/auth/firebase-admin-access', { token }),
};

// Companies
export const companiesApi = {
  search: (params: URLSearchParams) =>
    apiServer<PaginatedCompaniesResponse>(`/companies?${params}`),
  searchClient: (params: URLSearchParams) =>
    apiClient<PaginatedCompaniesResponse>(`/companies?${params}`, { token: null }),
  getBySlug: (slug: string) => apiServer<CompanyPublic>(`/companies/${slug}`),
  getDashboard: (token: string) =>
    apiClient<CompanyDashboard>('/companies/me/dashboard', { token }),
  getMyProfile: (token: string) =>
    apiClient<import('@rateq/types').CompanyDetail>('/companies/me/profile', { token }),
  updateMyProfile: (token: string, data: import('@rateq/types').UpdateCompanyInput) =>
    apiClient<import('@rateq/types').CompanyDetail>('/companies/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),
  register: (token: string, data: import('@rateq/types').CreateCompanyInput) =>
    apiClient<import('@rateq/types').CompanyDetail>('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),
  recordPageView: (slug: string, visitorId: string) =>
    apiClient<MessageResponse>(`/companies/${slug}/view`, {
      method: 'POST',
      body: JSON.stringify({ visitorId }),
    }),
};

export const contactApi = {
  submit: (data: import('@rateq/types').SubmitContactInput) =>
    apiClient<MessageResponse>('/contact', {
      method: 'POST',
      body: JSON.stringify(data),
      token: null,
    }),
};

export const usersOnboardingApi = {
  getStatus: (token: string) =>
    apiClient<import('@rateq/types').OnboardingStatus>('/users/me/onboarding', { token }),
  completeReviewer: (token: string, data: import('@rateq/types').CompleteReviewerProfileInput) =>
    apiClient<import('@rateq/types').OnboardingStatus>('/users/me/profile/reviewer', {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),
};

// Platform
export const platformApi = {
  getStats: () => apiServer<PlatformStats>('/platform/stats'),
};

// Reviews
export const reviewsApi = {
  listFeatured: () => apiServer<PaginatedReviewsResponse>('/reviews/featured'),
  listByCompany: (companyId: string, params?: URLSearchParams) =>
    apiServer<PaginatedReviewsResponse>(
      `/reviews/company/${companyId}${params ? `?${params}` : ''}`,
    ),
  listByCompanyManage: (token: string, companyId: string, params?: URLSearchParams) =>
    apiClient<PaginatedReviewsResponse>(
      `/reviews/company/${companyId}/manage${params ? `?${params}` : ''}`,
      { token },
    ),
  submit: (token: string, data: CreateReviewInput) =>
    apiClient<ReviewPublic>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),
  listMine: (token: string, params?: URLSearchParams) =>
    apiClient<PaginatedReviewsResponse>(`/reviews/me${params ? `?${params}` : ''}`, { token }),
  getDashboard: (token: string) =>
    apiClient<import('@rateq/types').ReviewerDashboard>('/reviews/me/dashboard', { token }),
  listAdmin: (token: string, params?: URLSearchParams) =>
    apiClient<PaginatedReviewsResponse>(`/moderation/reviews${params ? `?${params}` : ''}`, {
      token,
    }),
  listPending: (token: string, params?: URLSearchParams) =>
    apiClient<PaginatedReviewsResponse>(
      `/moderation/reviews/pending${params ? `?${params}` : ''}`,
      { token },
    ),
  approve: (token: string, id: string) =>
    apiClient<MessageResponse>(`/moderation/reviews/${id}/approve`, { method: 'PATCH', token }),
  reject: (token: string, id: string) =>
    apiClient<MessageResponse>(`/moderation/reviews/${id}/reject`, { method: 'PATCH', token }),
  resolve: (token: string, id: string) =>
    apiClient<MessageResponse>(`/moderation/reviews/${id}/resolve`, { method: 'PATCH', token }),
  deleteReview: (token: string, id: string) =>
    apiClient<MessageResponse>(`/moderation/reviews/${id}`, { method: 'DELETE', token }),
  deleteReviewReply: (token: string, reviewId: string) =>
    apiClient<MessageResponse>(`/moderation/reviews/${reviewId}/reply`, {
      method: 'DELETE',
      token,
    }),
  setResolutionWindow: (token: string, reviewId: string, days: 7 | 10) =>
    apiClient<ReviewPublic>(`/reviews/${reviewId}/resolution/window`, {
      method: 'PATCH',
      body: JSON.stringify({ days }),
      token,
    }),
  proceedResolution: (token: string, reviewId: string) =>
    apiClient<ReviewPublic>(`/reviews/${reviewId}/resolution/proceed`, {
      method: 'PATCH',
      token,
    }),
  withdrawResolution: (token: string, reviewId: string) =>
    apiClient<ReviewPublic>(`/reviews/${reviewId}/resolution/withdraw`, {
      method: 'PATCH',
      token,
    }),
  reply: (token: string, reviewId: string, content: string) =>
    apiClient<ReviewPublic>(`/reviews/${reviewId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ content }),
      token,
    }),
};

// Users
export const usersApi = {
  list: (token: string, params: URLSearchParams) =>
    apiClient<PaginatedUsersResponse>(`/users?${params}`, { token }),
  getProfile: (token: string) => apiClient<UserProfile>('/users/me/profile', { token }),
  update: (token: string, userId: string, data: import('@rateq/types').AdminUpdateUserInput) =>
    apiClient<UserProfile>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),
  delete: (token: string, userId: string) =>
    apiClient<MessageResponse>(`/users/${userId}`, { method: 'DELETE', token }),
};
