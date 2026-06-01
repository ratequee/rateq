'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { ReviewCard } from '@/components/review/review-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiError, reviewsApi, usersApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import type { PaginatedReviewsResponse, PaginatedUsersResponse } from '@rateq/types';
import { UserRole } from '@rateq/types';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function AdminDashboardPage() {
  const t = useTranslations('dashboard');
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState<PaginatedReviewsResponse | null>(null);
  const [users, setUsers] = useState<PaginatedUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    const [pendingRes, usersRes] = await Promise.all([
      reviewsApi.listPending(token),
      usersApi.list(token, new URLSearchParams({ limit: '10' })),
    ]);
    setPending(pendingRes);
    setUsers(usersRes);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== UserRole.ADMIN) {
      router.push('/login');
      return;
    }

    load()
      .catch((err) => toast.error(err instanceof ApiError ? err.message : 'Error'))
      .finally(() => setLoading(false));
  }, [user, authLoading, router, load]);

  const handleModerate = async (id: string, action: 'approve' | 'reject') => {
    const token = getAccessToken();
    if (!token) return;
    try {
      if (action === 'approve') await reviewsApi.approve(token, id);
      else await reviewsApi.reject(token, id);
      toast.success(action === 'approve' ? t('approve') : t('reject'));
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error');
    }
  };

  if (authLoading || loading) {
    return <div className="mx-auto max-w-6xl px-4 py-12 text-center">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">{t('adminTitle')}</h1>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">{t('pendingQueue')}</h2>
        {!pending || pending.data.length === 0 ? (
          <p className="text-slate-500">No pending reviews</p>
        ) : (
          <div className="space-y-4">
            {pending.data.map((review) => (
              <div key={review.id} className="space-y-2">
                <ReviewCard review={review} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleModerate(review.id, 'approve')}>
                    {t('approve')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleModerate(review.id, 'reject')}
                  >
                    {t('reject')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-4">{t('users')}</h2>
        <Card>
          <CardHeader>
            <CardTitle>{users?.meta.total ?? 0} users</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {users?.data.map((u) => (
                <li key={u.id} className="flex justify-between py-2">
                  <span>{u.email}</span>
                  <span className="text-slate-500">
                    {u.role} · {u.isVerified ? 'verified' : 'unverified'}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
