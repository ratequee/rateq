import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
  controls?: React.ReactNode;
}

export function SectionHeader({
  title,
  actionLabel,
  actionHref,
  className,
  controls,
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-8 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="flex flex-wrap items-center gap-4">
        <h2 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h2>
        {controls}
      </div>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-500 transition-colors hover:text-brand-600"
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </Link>
      )}
    </div>
  );
}
