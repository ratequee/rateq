'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useProfile } from '@/components/providers/profile-provider';
import { Button } from '@/components/ui/button';
import { ApiError, reviewsApi } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';
import { ReviewStatus } from '@rateq/types';
import type { ReviewPublic } from '@rateq/types';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

interface ReviewReplyFormProps {
  review: ReviewPublic;
  companyId: string;
  onReplied?: (review: ReviewPublic) => void;
}

export function ReviewReplyForm({ review, companyId, onReplied }: ReviewReplyFormProps) {
  const t = useTranslations('review');
  const { user } = useAuth();
  const { onboarding } = useProfile();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const canReply =
    user &&
    onboarding?.company?.id === companyId &&
    review.status === ReviewStatus.APPROVED &&
    !review.reply;

  if (!canReply) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (content.trim().length < 5) {
      toast.error(t('replyTooShort'));
      return;
    }

    setLoading(true);
    try {
      const token = await ensureValidAccessToken();
      if (!token) throw new Error('Not authenticated');

      const updated = await reviewsApi.reply(token, review.id, content.trim());
      toast.success(t('replySubmitted'));
      setContent('');
      onReplied?.(updated);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('replySubmit');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-3 rounded-xl border border-dashed border-brand-200 bg-white p-4"
    >
      <label className="block text-xs font-semibold uppercase tracking-wide text-brand-600">
        {t('writeReply')}
      </label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        required
        minLength={5}
        placeholder={t('replyPlaceholder')}
        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
      />
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? '...' : t('replySubmit')}
      </Button>
    </form>
  );
}
