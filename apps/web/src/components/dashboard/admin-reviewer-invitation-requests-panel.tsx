'use client';

import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import type { ReviewerInvitationRequestPublic } from '@rateq/types';
import { ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  rejected: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400',
};

export function AdminReviewerInvitationRequestsPanel() {
  const t = useTranslations('adminReviewerInvitations');
  const [requests, setRequests] = useState<ReviewerInvitationRequestPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRequests(await adminApi.listReviewerInvitationRequests());
    } catch {
      toast.error(t('loadError'));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (id: string, action: 'approve' | 'reject' | 'delete') => {
    if (action === 'delete' && !window.confirm(t('deleteConfirm'))) return;

    setActingId(id);
    try {
      if (action === 'approve') {
        await adminApi.approveReviewerInvitationRequest(id);
        toast.success(t('approved'));
      } else if (action === 'reject') {
        await adminApi.rejectReviewerInvitationRequest(id);
        toast.success(t('rejected'));
      } else {
        await adminApi.deleteReviewerInvitationRequest(id);
        toast.success(t('deleted'));
      }
      await load();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('actionError');
      toast.error(message);
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (requests.length === 0) {
    return <p className="py-8 text-center text-sm text-secondary">{t('empty')}</p>;
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <article key={request.id} className="rounded-2xl surface-card border p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-primary">{request.reviewerName}</p>
              <p className="text-sm text-secondary">{request.email}</p>
              <p className="mt-1 text-sm text-secondary">
                {t('companyLabel')}: {request.companyName ?? '—'}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[request.status]}`}
            >
              {t(`status.${request.status}`)}
            </span>
          </div>

          <p className="mt-3 text-sm text-secondary">{request.serviceProvided}</p>

          {request.proofUrls.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {request.proofUrls.map((url, index) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-subtle px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-300"
                  >
                    {t('proofFile', { index: index + 1 })}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          {request.status === 'pending' ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={actingId === request.id}
                onClick={() => void act(request.id, 'approve')}
              >
                {actingId === request.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('approve')
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={actingId === request.id}
                onClick={() => void act(request.id, 'reject')}
              >
                {t('reject')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={actingId === request.id}
                onClick={() => void act(request.id, 'delete')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="mt-4">
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={actingId === request.id}
                onClick={() => void act(request.id, 'delete')}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('delete')}
              </Button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
