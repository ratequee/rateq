import { cn } from '@/lib/utils';

interface CategoryBilingualNameProps {
  nameEn: string;
  nameAr: string;
  className?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
  as?: 'span' | 'div';
}

export function CategoryBilingualName({
  nameEn,
  nameAr,
  className,
  primaryClassName,
  secondaryClassName,
  as: Tag = 'span',
}: CategoryBilingualNameProps) {
  const showBoth = nameEn.trim() !== nameAr.trim();

  return (
    <Tag className={className}>
      <span className={cn('block', primaryClassName)} lang="en">
        {nameEn}
      </span>
      {showBoth ? (
        <span className={cn('mt-0.5 block', secondaryClassName)} dir="rtl" lang="ar">
          {nameAr}
        </span>
      ) : null}
    </Tag>
  );
}
