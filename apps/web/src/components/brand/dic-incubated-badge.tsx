import { cn } from '@/lib/utils';
import Image from 'next/image';

interface DicIncubatedBadgeProps {
  className?: string;
}

/**
 * Digital Incubation Center “Incubated at” badge (white artwork for dark/black footers).
 */
export function DicIncubatedBadge({ className }: DicIncubatedBadgeProps) {
  return (
    <Image
      src="/images/dic-incubated-dark.png"
      alt="Incubated at Digital Incubation Center — محتضن لدى حاضنة الأعمال الرقمية"
      width={480}
      height={190}
      className={cn('h-20 w-auto sm:h-24 lg:h-28', className)}
    />
  );
}
