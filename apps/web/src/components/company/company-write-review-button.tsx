'use client';

import { Button } from '@/components/ui/button';
import { dispatchOpenWriteReview } from '@/lib/write-review-events';
import { PenLine } from 'lucide-react';

interface CompanyWriteReviewButtonProps {
  label: string;
}

export function CompanyWriteReviewButton({ label }: CompanyWriteReviewButtonProps) {
  const handleClick = () => {
    dispatchOpenWriteReview();
    document.getElementById('write-review')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Button type="button" size="lg" className="gap-1 text-sm" onClick={handleClick}>
      <PenLine className="h-4 w-4" />
      {label}
    </Button>
  );
}
