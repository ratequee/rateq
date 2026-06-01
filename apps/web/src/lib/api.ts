import type {
  AuthResponse,
  AuthenticatedUser,
  AuthTokens,
  CompanyDashboard,
  CompanyPublic,
  PaginatedCompaniesResponse,
  PaginatedReviewsResponse,
  PaginatedUsersResponse,
  ReviewPublic,
  UserProfile,
} from '@rateq/types';
import type { MessageResponse } from '@rateq/types';

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

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  const body = (await response.json()) as ApiEnvelope<T> | { message: string; statusCode: number };

  if (!response.ok) {
    const err = body as { message: string; statusCode: number; errors?: Record<string, string[]> };
    throw new ApiError(err.message ?? 'Request failed', err.statusCode ?? response.status, err.errors);
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
};

// Reviews
export const reviewsApi = {
  listByCompany: (companyId: string, params?: URLSearchParams) =>
    apiServer<PaginatedReviewsResponse>(
      `/reviews/company/${companyId}${params ? `?${params}` : ''}`,
    ),
  listByCompanyManage: (token: string, companyId: string, params?: URLSearchParams) =>
    apiClient<PaginatedReviewsResponse>(
      `/reviews/company/${companyId}/manage${params ? `?${params}` : ''}`,
      { token },
    ),
  submit: (
    token: string,
    data: {
      companyId: string;
      rating: number;
      title: string;
      content: string;
      deviceFingerprint?: string;
    },
  ) =>
    apiClient<ReviewPublic>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),
  listMine: (token: string, page = 1) =>
    apiClient<PaginatedReviewsResponse>(`/reviews/me?page=${page}`, { token }),
  listPending: (token: string, page = 1) =>
    apiClient<PaginatedReviewsResponse>(`/moderation/reviews/pending?page=${page}`, { token }),
  approve: (token: string, id: string) =>
    apiClient<MessageResponse>(`/moderation/reviews/${id}/approve`, { method: 'PATCH', token }),
  reject: (token: string, id: string) =>
    apiClient<MessageResponse>(`/moderation/reviews/${id}/reject`, { method: 'PATCH', token }),
};

// Users
export const usersApi = {
  list: (token: string, params: URLSearchParams) =>
    apiClient<PaginatedUsersResponse>(`/users?${params}`, { token }),
  getProfile: (token: string) => apiClient<UserProfile>('/users/me/profile', { token }),
};
