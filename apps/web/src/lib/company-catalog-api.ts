import type { CompanyCatalogItemPublic, CompanyCatalogType } from '@rateq/types';
import { apiClient } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';

export async function fetchCompanyCatalogClient(
  type?: CompanyCatalogType,
): Promise<CompanyCatalogItemPublic[]> {
  const search = type ? `?type=${type}` : '';
  return apiClient<CompanyCatalogItemPublic[]>(`/company-catalog${search}`);
}

export async function fetchCompanyCatalogAdmin(
  type?: CompanyCatalogType,
): Promise<CompanyCatalogItemPublic[]> {
  const token = await ensureValidAccessToken();
  if (!token) throw new Error('Session expired');
  const search = type ? `?type=${type}` : '';
  return apiClient<CompanyCatalogItemPublic[]>(`/admin/company-catalog${search}`, { token });
}
