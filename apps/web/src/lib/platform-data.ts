import type { PlatformStats } from '@rateq/types';
import { platformApi } from '@/lib/api';

const EMPTY_STATS: PlatformStats = {
  totalCompanies: 0,
  totalReviewers: 0,
  totalReviews: 0,
};

export async function fetchPlatformStats(): Promise<PlatformStats> {
  try {
    return await platformApi.getStats();
  } catch {
    return EMPTY_STATS;
  }
}

export function formatStatNumber(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${millions >= 10 ? Math.round(millions) : millions.toFixed(1).replace(/\.0$/, '')}M`;
  }

  if (value >= 1_000) {
    const thousands = value / 1_000;
    return `${thousands >= 10 ? Math.round(thousands) : thousands.toFixed(1).replace(/\.0$/, '')}K`;
  }

  return value.toLocaleString('en-US');
}
