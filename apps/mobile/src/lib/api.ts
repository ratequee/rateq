import type {
  AuthResponse,
  AuthenticatedUser,
  AuthTokens,
  CompanyPublic,
  PaginatedCompaniesResponse,
  PaginatedReviewsResponse,
  ReviewPublic,
  UserProfile,
} from '@rateq/types';
import Constants from 'expo-constants';

const API_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  Constants.expoConfig?.extra?.apiUrl ||
  'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiEnvelope<T> {
  data: T;
}

type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter = async () => null;

export function setTokenGetter(getter: TokenGetter): void {
  tokenGetter = getter;
}

export async function apiClient<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, ...init } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (auth) {
    const token = await tokenGetter();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  const body = (await response.json()) as ApiEnvelope<T> | { message: string; statusCode: number };

  if (!response.ok) {
    const err = body as { message: string; statusCode: number };
    throw new ApiError(err.message ?? 'Request failed', err.statusCode ?? response.status);
  }

  if (body && typeof body === 'object' && 'data' in body) {
    return (body as ApiEnvelope<T>).data;
  }

  return body as T;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      auth: false,
    }),
  register: (data: { email: string; password: string; role?: string }) =>
    apiClient<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      auth: false,
    }),
  me: () => apiClient<AuthenticatedUser>('/auth/me'),
};

export const companiesApi = {
  search: (params: URLSearchParams) =>
    apiClient<PaginatedCompaniesResponse>(`/companies?${params}`, { auth: false }),
  getBySlug: (slug: string) =>
    apiClient<CompanyPublic>(`/companies/${slug}`, { auth: false }),
};

export const reviewsApi = {
  listByCompany: (companyId: string) =>
    apiClient<PaginatedReviewsResponse>(`/reviews/company/${companyId}`, { auth: false }),
  submit: (data: {
    companyId: string;
    rating: number;
    title: string;
    content: string;
    deviceFingerprint?: string;
  }) =>
    apiClient<ReviewPublic>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listMine: (page = 1) => apiClient<PaginatedReviewsResponse>(`/reviews/me?page=${page}`),
};

export const usersApi = {
  getProfile: () => apiClient<UserProfile>('/users/me/profile'),
};

export type { AuthTokens, AuthenticatedUser };
