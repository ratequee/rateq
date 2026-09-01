import type {
  AuthResponse,
  AuthenticatedUser,
  AuthTokens,
  CategoryPublic,
  CompanyCatalogItemPublic,
  CompanyCatalogType,
  CompanyPublic,
  CompleteReviewerProfileInput,
  CreateCompanyInput,
  MessageResponse,
  OnboardingStatus,
  PaginatedCompaniesResponse,
  PaginatedReviewsResponse,
  ReviewPublic,
  UpdateCompanyInput,
  UserProfile,
} from '@rateq/types';
import type { CompanyDetail } from '@rateq/types';
import Constants from 'expo-constants';
import { ensureValidAccessToken, refreshAccessToken } from '@/lib/auth-session';
import { getRefreshToken } from '@/lib/storage';

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
    const token = await ensureValidAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response = await fetch(`${API_URL}${path}`, { ...init, headers });
  const refreshToken = auth ? await getRefreshToken() : null;

  if (
    response.status === 401 &&
    auth &&
    refreshToken &&
    !path.includes('/auth/refresh') &&
    !path.includes('/auth/firebase')
  ) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      headers.Authorization = `Bearer ${newAccessToken}`;
      response = await fetch(`${API_URL}${path}`, { ...init, headers });
    }
  }

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
  firebaseLogin: (idToken: string) =>
    apiClient<AuthResponse>('/auth/firebase', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
      auth: false,
    }),
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
  logout: () =>
    apiClient<void>('/auth/logout', {
      method: 'POST',
      auth: true,
    }),
  refresh: (refreshToken: string) =>
    apiClient<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      auth: false,
    }),
  me: () => apiClient<AuthenticatedUser>('/auth/me'),
  getFirebaseCustomToken: () => apiClient<{ customToken: string }>('/auth/firebase-custom-token'),
};

export const companiesApi = {
  search: (params: URLSearchParams) =>
    apiClient<PaginatedCompaniesResponse>(`/companies?${params}`, { auth: false }),
  getBySlug: (slug: string) => apiClient<CompanyPublic>(`/companies/${slug}`),
  listFavorites: () => apiClient<CompanyPublic[]>('/companies/me/favorites'),
  addFavorite: (companyId: string) =>
    apiClient<{ isFavorited: true }>(`/companies/${companyId}/favorite`, { method: 'POST' }),
  removeFavorite: (companyId: string) =>
    apiClient<{ isFavorited: false }>(`/companies/${companyId}/favorite`, { method: 'DELETE' }),
};

export const reviewsApi = {
  listFeatured: () => apiClient<PaginatedReviewsResponse>('/reviews/featured', { auth: false }),
  listByCompany: (companyId: string) =>
    apiClient<PaginatedReviewsResponse>(`/reviews/company/${companyId}`, { auth: false }),
  submit: (data: {
    companyId: string;
    rating: number;
    title: string;
    content: string;
    proofUrls: string[];
    deviceFingerprint?: string;
  }) =>
    apiClient<ReviewPublic>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listMine: (params?: URLSearchParams) => {
    const query = params?.toString();
    return apiClient<PaginatedReviewsResponse>(`/reviews/me${query ? `?${query}` : ''}`);
  },
  listByCompanyManage: (companyId: string, params?: URLSearchParams) => {
    const query = params?.toString();
    return apiClient<PaginatedReviewsResponse>(
      `/reviews/company/${companyId}/manage${query ? `?${query}` : ''}`,
    );
  },
};

export const usersApi = {
  getProfile: () => apiClient<UserProfile>('/users/me/profile'),
};

export const onboardingApi = {
  getStatus: () => apiClient<OnboardingStatus>('/users/me/onboarding'),
  completeReviewer: (data: CompleteReviewerProfileInput) =>
    apiClient<OnboardingStatus>('/users/me/profile/reviewer', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  registerCompany: (data: CreateCompanyInput) =>
    apiClient<CompanyDetail>('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCompany: (data: UpdateCompanyInput) =>
    apiClient<CompanyDetail>('/companies/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  syncPhone: (phone: string, context: 'reviewer' | 'company') =>
    apiClient<MessageResponse>('/users/me/phone/sync', {
      method: 'POST',
      body: JSON.stringify({ phone, context }),
    }),
};

export const categoriesApi = {
  list: () => apiClient<CategoryPublic[]>('/categories', { auth: false }),
};

export const catalogApi = {
  list: (type?: CompanyCatalogType) => {
    const search = type ? `?type=${type}` : '';
    return apiClient<CompanyCatalogItemPublic[]>(`/company-catalog${search}`, { auth: false });
  },
};

export type { AuthTokens, AuthenticatedUser };
