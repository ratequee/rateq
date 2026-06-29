'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/providers/auth-provider';
import { reviewsApi } from '@/lib/api';
import { useRouter } from '@/i18n/routing';
import { Flag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

interface ReportReviewButtonProps {
  reviewId: string;
}

export function ReportReviewButton({ reviewId }: ReportReviewButtonProps) {
  const t = useTranslations('review');
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setSubmitting(true);
    try {
      await reviewsApi.reportReview(reviewId, reason.trim() || undefined);
      toast.success(t('reportSubmitted'));
      setOpen(false);
      setReason('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('reportError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => (user ? setOpen(true) : router.push('/login'))}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary hover:text-brand-500"
      >
        <Flag className="h-3.5 w-3.5" />
        {t('reportReview')}
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-subtle bg-white p-3 dark:bg-dm-elevated">
      <p className="text-sm font-medium text-primary">{t('reportReviewTitle')}</p>
      <Input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder={t('reportReviewPlaceholder')}
        className="mt-2 h-10"
      />
      <div className="mt-3 flex gap-2">
        <Button type="button" size="sm" disabled={submitting} onClick={() => void submit()}>
          {submitting ? t('reportSubmitting') : t('reportSubmit')}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>
          {t('reportCancel')}
        </Button>
      </div>
    </div>
  );
}
