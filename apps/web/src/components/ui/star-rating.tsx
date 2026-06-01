'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (value: number) => void;
}

const sizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' };

export function StarRating({
  value,
  max = 5,
  size = 'md',
  interactive,
  onChange,
}: StarRatingProps) {
  const stars = Array.from({ length: max }, (_, i) => {
    const filled = i < Math.round(value);
    const star = (
      <Star
        className={cn(sizes[size], filled ? 'fill-gold-300 text-gold-300' : 'text-slate-300')}
      />
    );

    if (interactive) {
      return (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i + 1)}
          className="cursor-pointer transition-transform hover:scale-110"
          aria-label={`Rate ${i + 1}`}
        >
          {star}
        </button>
      );
    }

    return (
      <span key={i} aria-hidden>
        {star}
      </span>
    );
  });

  return (
    <div
      className="flex items-center gap-0.5"
      role={interactive ? 'group' : 'img'}
      aria-label={interactive ? undefined : `${value} out of ${max} stars`}
    >
      {stars}
    </div>
  );
}
