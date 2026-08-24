'use client';

import { AdminCompanyForm } from '@/components/dashboard/admin-company-form';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useRequireAdmin } from '@/hooks/use-require-admin';
import { adminApi } from '@/lib/admin-api';
import { adminApi as adminPlatformApi } from '@/lib/admin-platform-api';
import { ApiError } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';
import { AdminPermission } from '@rateq/types';
import type { AdminCompanyFormInitialValues } from '@/components/dashboard/admin-company-form';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function AdminEditCompanyPage() {
  const t = useTranslations('adminCompanyForm');
  const params = useParams<{ id: string }>();
  const companyId = params.id;
  useRequireAdmin(AdminPermission.COMPANIES);

  const [loading, setLoading] = useState(true);
  const [initialValues, setInitialValues] = useState<AdminCompanyFormInitialValues | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const token = await ensureValidAccessToken();
        if (!token) throw new Error(t('errors.sessionExpired'));

        try {
          const detail = await adminPlatformApi.getCompanyDetail(token, companyId);
          if (cancelled) return;
          setInitialValues({
            name: detail.name,
            nameAr: detail.nameAr,
            descriptionEn: detail.descriptionEn,
            descriptionAr: detail.descriptionAr,
            description: detail.description,
            phone: detail.phone,
            address: detail.address,
            latitude: detail.latitude,
            longitude: detail.longitude,
            city: detail.city,
            country: detail.country,
            categoryIds: detail.categoryIds,
            categoryId: detail.categoryId,
            serviceItems: detail.serviceItems,
            activityItems: detail.activityItems,
            crNumber: detail.crNumber,
            validationDate: detail.validationDate,
            firstRegistrationDate: detail.firstRegistrationDate,
            yearsEstablished: detail.yearsEstablished,
            publicProjectCount: detail.publicProjectCount,
            privateProjectCount: detail.privateProjectCount,
            registrationDocUrl: detail.registrationDocUrl,
            establishmentCardUrl: detail.establishmentCardUrl,
            tradeLicenseUrl: detail.tradeLicenseUrl,
            logo: detail.logo,
            coverUrl: detail.coverUrl,
            websiteUrl: detail.websiteUrl,
            socialLinks: detail.socialLinks,
            ownerEmail: detail.ownerEmail,
          });
        } catch {
          const verification = await adminApi.getCompanyVerification(companyId);
          if (cancelled) return;
          setInitialValues({
            name: verification.name,
            description: verification.description,
            address: verification.address,
            city: verification.city,
            country: verification.country,
            crNumber: verification.crNumber,
            validationDate: verification.validationDate,
            registrationDocUrl: verification.registrationDocUrl,
            establishmentCardUrl: verification.establishmentCardUrl,
            tradeLicenseUrl: verification.tradeLicenseUrl,
            logo: verification.logo,
            coverUrl: verification.coverUrl,
            ownerEmail: verification.owner?.email,
          });
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof ApiError ? err.message : t('errors.loadFailed');
          toast.error(message);
          setInitialValues(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [companyId, t]);

  return (
    <DashboardShell role="admin">
      <DashboardPageHeader title={t('editTitle')} subtitle={t('editSubtitle')} />
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-secondary">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t('loading')}
        </div>
      ) : initialValues ? (
        <AdminCompanyForm mode="edit" companyId={companyId} initialValues={initialValues} />
      ) : (
        <p className="py-16 text-center text-sm text-secondary">{t('errors.loadFailed')}</p>
      )}
    </DashboardShell>
  );
}
