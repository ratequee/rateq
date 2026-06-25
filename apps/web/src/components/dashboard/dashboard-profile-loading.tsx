'use client';

import { Loader2 } from 'lucide-react';

export function DashboardProfileLoading() {
  return (
    <div className="flex items-center justify-center py-20 text-secondary">
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
    </div>
  );
}
