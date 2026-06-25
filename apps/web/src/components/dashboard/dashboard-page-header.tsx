interface DashboardPageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function DashboardPageHeader({ title, subtitle, className }: DashboardPageHeaderProps) {
  return (
    <div className={className ?? 'mb-6'}>
      <h1 className="text-2xl font-bold text-primary dark:text-white">{title}</h1>
      {subtitle ? (
        <p className="mt-1 text-sm text-secondary dark:text-slate-300">{subtitle}</p>
      ) : null}
    </div>
  );
}
