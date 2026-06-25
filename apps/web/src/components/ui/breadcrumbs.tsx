import { Link } from '@/i18n/routing';
import { ChevronRight } from 'lucide-react';
import type { JSX } from 'react';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  ariaLabel: string;
  variant?: 'light' | 'dark';
}

export function Breadcrumbs({
  items,
  ariaLabel,
  variant = 'light',
}: BreadcrumbsProps): JSX.Element {
  const isDark = variant === 'dark';

  return (
    <nav aria-label={ariaLabel} className="mb-6">
      <ol
        className={`flex flex-wrap items-center gap-1.5 text-sm ${
          isDark ? 'text-white/80' : 'text-ink-muted dark:text-white/80'
        }`}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.href} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 shrink-0 rtl:rotate-180" aria-hidden />
              )}
              {isLast ? (
                <span
                  className={`font-medium ${isDark ? 'text-white' : 'text-gold-300 dark:text-white'}`}
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={`transition-colors ${
                    isDark
                      ? 'text-white/80 hover:text-white'
                      : 'hover:text-gold-300 dark:text-white/80 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
