'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StarRating } from '@/components/ui/star-rating';
import { ApiError, reviewsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { UserRole } from '@rateq/types';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

interface WriteReviewFormProps {
  companyId: string;
  className?: string;
}

export function WriteReviewForm({ companyId, className }: WriteReviewFormProps) {
  const t = useTranslations('review');
  const ta = useTranslations('auth');
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) return null;
  if (user.role === UserRole.COMPANY) return null;
  if (!user.isVerified) {
    return (
      <Card className={cn('border-amber-200 bg-amber-50', className)}>
        <CardContent className="p-4 text-sm text-amber-800">{ta('verifyNotice')}</CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('rateq_access_token');
      if (!token) throw new Error('Not authenticated');

      await reviewsApi.submit(token, {
        companyId,
        rating,
        title,
        content,
      });
      toast.success(t('pending'));
      setTitle('');
      setContent('');
      window.location.reload();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('submit');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t('submit')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">{t('rating')}</label>
            <StarRating value={rating} interactive onChange={setRating} />
          </div>
          <div>
            <label className="text-sm font-medium">{t('title')}</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} />
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
