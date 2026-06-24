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
    <div className="surface-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-secondary">{label}</p>
          <p className="mt-2 text-3xl font-bold text-primary">{value}</p>
          <p
            className={cn(
              'mt-1 text-xs font-medium',
              positive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-500 dark:text-red-400',
            )}
          >
            {change}
          </p>
        </div>
        <div className="rounded-xl bg-brand-50 p-2.5 text-brand-500 dark:bg-brand-950/50 dark:text-brand-300">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
