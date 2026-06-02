'use client';

import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface ReviewsPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function navButtonClass(active?: boolean) {
  return cn(
    'inline-flex h-9 min-w-9 items-center justify-center rounded-md border text-sm font-medium transition-colors',
    active
      ? 'border-brand-500 bg-brand-500 text-white'
      : 'border-slate-200 bg-slate-100 text-ink hover:bg-slate-200',
  );
}

export function ReviewsPagination({
  page,
  totalPages,
  onPageChange,
  className,
}: ReviewsPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      className={cn('flex flex-wrap items-center justify-end gap-1.5', className)}
      aria-label="Reviews pagination"
    >
      <button
        type="button"
        className={navButtonClass()}
        onClick={() => onPageChange(1)}
        disabled={page <= 1}
        aria-label="First page"
      >
        <ChevronsLeft className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        className={navButtonClass()}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>

      {pages.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          className={navButtonClass(pageNumber === page)}
          onClick={() => onPageChange(pageNumber)}
          aria-current={pageNumber === page ? 'page' : undefined}
        >
          {pageNumber}
        </button>
      ))}

      <button
        type="button"
        className={navButtonClass()}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        className={navButtonClass()}
        onClick={() => onPageChange(totalPages)}
        disabled={page >= totalPages}
        aria-label="Last page"
      >
        <ChevronsRight className="h-4 w-4" aria-hidden />
      </button>
    </nav>
  );
}
