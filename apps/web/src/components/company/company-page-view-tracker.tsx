'use client';

import { companiesApi } from '@/lib/api';
import { getOrCreateVisitorId } from '@/lib/visitor-id';
import { useEffect } from 'react';

interface CompanyPageViewTrackerProps {
  slug: string;
}

export function CompanyPageViewTracker({ slug }: CompanyPageViewTrackerProps) {
  useEffect(() => {
    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return;

    companiesApi.recordPageView(slug, visitorId).catch(() => {});
  }, [slug]);

  return null;
}
