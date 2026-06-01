'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { ReviewCard } from '@/components/review/review-card';
import { Card, CardContent } from '@/components/ui/card';
import { ApiError, companiesApi, reviewsApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import type { CompanyDashboard, PaginatedReviewsResponse } from '@rateq/types';
import { UserRole } from '@rateq/types';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Building2, Star, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function CompanyDashboardPage() {
  const t = useTranslations('dashboard');
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<CompanyDashboard | null>(null);
  const [reviews, setReviews] = useState<PaginatedReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.role !== UserRole.COMPANY && user.role !== UserRole.ADMIN)) {
      router.push('/login');
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    Promise.all([
      companiesApi.getDashboard(token),
      companiesApi.getMyProfile(token).then((company) =>
        reviewsApi.listByCompanyManage(
          token,
          company.id,
          new URLSearchParams({ limit: '10' }),
        ),
      ),
    ])
      .then(([dash, rev]) => {
        setDashboard(dash);
        if (rev) setReviews(rev);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.statusCode === 404) {
          toast.error('Register your company first');
          router.push('/register');
        } else {
          toast.error(err instanceof ApiError ? err.message : 'Error');
        }
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-center text-slate-500">
        Loading...
      </div>
    );
  }

  if (!dashboard) return null;

  const stats = [
    { label: t('totalReviews'), value: dashboard.stats.totalReviews, icon: Star },
    { label: t('averageRating'), value: dashboard.stats.averageRating.toFixed(1), icon: Building2 },
    { label: t('pending'), value: dashboard.stats.pendingReviews, icon: Clock },
    { label: t('approved'), value: dashboard.stats.approvedReviews, icon: CheckCircle },
    { label: t('rejected'), value: dashboard.stats.rejectedReviews, icon: XCircle },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">{t('companyTitle')}</h1>
      <p className="mt-1 text-slate-500">{dashboard.company.name}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <s.icon className="h-8 w-8 text-brand-600" />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4">{t('manageReviews')}</h2>
        {reviews && reviews.data.length > 0 ? (
          <div className="space-y-4">
            {reviews.data.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        ) : (
          <p className="text-slate-500">No reviews yet</p>
        )}
      </section>
    </div>
  );
}
