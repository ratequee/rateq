import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselControlsProps {
  onPrev: () => void;
  onNext: () => void;
  className?: string;
  prevLabel?: string;
  nextLabel?: string;
}

export function CarouselControls({
  onPrev,
  onNext,
  className,
  prevLabel = 'Previous',
  nextLabel = 'Next',
}: CarouselControlsProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={onPrev}
        aria-label={prevLabel}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-brand-500 transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:border-white/40 dark:hover:bg-slate-700"
      >
        <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
      </button>
      <button
        type="button"
        onClick={onNext}
        aria-label={nextLabel}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-brand-500 transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:border-white/40 dark:hover:bg-slate-700"
      >
        <ChevronRight className="h-5 w-5 rtl:rotate-180" />
      </button>
    </div>
  );
}
