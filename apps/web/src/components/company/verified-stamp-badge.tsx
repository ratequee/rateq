import Image from 'next/image';
import { cn } from '@/lib/utils';

interface VerifiedStampBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
  alt?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 sm:h-9 sm:w-9',
  md: 'h-10 w-10 sm:h-12 sm:w-12',
};

export function VerifiedStampBadge({
  className,
  size = 'sm',
  alt = 'Verified',
}: VerifiedStampBadgeProps) {
  return (
    <Image
      src="/images/approved-stamp.png"
      alt={alt}
      width={48}
      height={48}
      className={cn('shrink-0 object-contain', sizeClasses[size], className)}
    />
  );
}
