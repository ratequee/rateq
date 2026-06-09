import type { PaginatedCompaniesResponse } from '@rateq/types';
import { companiesApi } from '@/lib/api';

const EMPTY_META = {
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

export async function fetchCompanies(params: URLSearchParams): Promise<PaginatedCompaniesResponse> {
  try {
    return await companiesApi.search(params);
  } catch {
    return { data: [], meta: EMPTY_META };
  }
}

export async function fetchCompanyBySlug(slug: string) {
  try {
    return await companiesApi.getBySlug(slug);
  } catch {
    return null;
  }
}
