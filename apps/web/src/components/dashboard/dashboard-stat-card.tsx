import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface DashboardStatCardProps {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: LucideIcon;
}

export function DashboardStatCard({
  label,
  value,
  change,
  positive,
  icon: Icon,
}: DashboardStatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink-muted">{label}</p>
          <p className="mt-2 text-3xl font-bold text-ink">{value}</p>
          <p className={cn('mt-1 text-xs font-medium', positive ? 'text-emerald-600' : 'text-red-500')}>
            {change}
          </p>
        </div>
        <div className="rounded-xl bg-brand-50 p-2.5 text-brand-500">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
