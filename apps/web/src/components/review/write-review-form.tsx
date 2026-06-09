'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StarRating } from '@/components/ui/star-rating';
import { ApiError, reviewsApi } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';
import type { ReviewPublic } from '@rateq/types';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

interface WriteReviewFormProps {
  companyId: string;
  className?: string;
  onSubmitted?: (review: ReviewPublic) => void;
  onCancel?: () => void;
}

export function WriteReviewForm({
  companyId,
  className,
  onSubmitted,
  onCancel,
}: WriteReviewFormProps) {
  const t = useTranslations('review');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await ensureValidAccessToken();
      if (!token) throw new Error('Not authenticated');

      const review = await reviewsApi.submit(token, {
        companyId,
        rating,
        title,
        content,
      });
      toast.success(t('submittedSuccess'));
      setTitle('');
      setContent('');
      setRating(5);
      onSubmitted?.(review);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('submit');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle>{t('submit')}</CardTitle>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            {t('cancel')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">{t('rating')}</label>
            <StarRating value={rating} interactive onChange={setRating} />
          </div>
          <div>
            <label className="text-sm font-medium">{t('title')}</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t('content')}</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              minLength={20}
              rows={4}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? '...' : t('submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
