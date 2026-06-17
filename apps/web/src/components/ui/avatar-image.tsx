import { getReviewAuthorInitial } from '@/lib/review-author';
import { cn } from '@/lib/utils';

interface AvatarImageProps {
  src?: string | null;
  name: string;
  className?: string;
  variant?: 'circle' | 'rounded';
}

export function AvatarImage({ src, name, className, variant = 'circle' }: AvatarImageProps) {
  const shape = variant === 'circle' ? 'rounded-full' : 'rounded-lg';

  if (src) {
    return <img src={src} alt={name} className={cn(shape, 'object-cover', className)} />;
  }

  return (
    <div
      aria-hidden
      className={cn(
        shape,
        'flex items-center justify-center bg-brand-100 text-sm font-semibold text-brand-600',
        className,
      )}
    >
      {getReviewAuthorInitial(name)}
    </div>
  );
}
