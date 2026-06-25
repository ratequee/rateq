'use client';

import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import { ADMIN_PAYMENT_ROWS, ADMIN_PAYMENT_STATS } from '@/lib/admin-static-data';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock3, CreditCard, Wallet } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

const statusStyles = {
  completed: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  failed: 'bg-red-50 text-red-700',
  refunded: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
} as const;

function formatQar(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'QAR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AdminPaymentsPanel() {
  const t = useTranslations('adminPayments');
  const locale = useLocale();

  const stats = [
    {
      key: 'totalRevenue',
      value: formatQar(ADMIN_PAYMENT_STATS.totalRevenueQar, locale),
      change: t('statsChangeUp', { value: '+14%' }),
      positive: true,
      icon: Wallet,
    },
    {
      key: 'pendingPayouts',
      value: formatQar(ADMIN_PAYMENT_STATS.pendingPayoutsQar, locale),
      change: t('statsAwaitingTransfer'),
      positive: false,
      icon: Clock3,
    },
    {
      key: 'completedThisMonth',
      value: String(ADMIN_PAYMENT_STATS.completedThisMonth),
      change: t('statsChangeUp', { value: '+6' }),
      positive: true,
      icon: CheckCircle2,
    },
    {
      key: 'activeSubscriptions',
      value: String(ADMIN_PAYMENT_STATS.activeSubscriptions),
      change: t('statsChangeUp', { value: '+2' }),
      positive: true,
      icon: CreditCard,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <DashboardStatCard
            key={stat.key}
            label={t(`stats.${stat.key}`)}
            value={stat.value}
            change={stat.change}
            positive={stat.positive}
            icon={stat.icon}
          />
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl surface-card border shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-primary">{t('tableTitle')}</h2>
          <p className="mt-1 text-sm text-secondary">{t('tableSubtitle')}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-secondary">
              <tr>
                <th className="px-5 py-3 text-start font-medium">{t('table.reference')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('table.payer')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('table.plan')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('table.amount')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('table.status')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('table.date')}</th>
              </tr>
            </thead>
            <tbody>
              {ADMIN_PAYMENT_ROWS.map((payment) => (
                <tr key={payment.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-medium text-primary">{payment.reference}</td>
                  <td className="px-5 py-4 text-primary">{t(`rows.${payment.id}.payer`)}</td>
                  <td className="px-5 py-4 text-secondary">{t(`rows.${payment.id}.plan`)}</td>
                  <td className="px-5 py-4 font-medium text-primary">
                    {formatQar(payment.amountQar, locale)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-3 py-1 text-xs font-medium',
                        statusStyles[payment.status],
                      )}
                    >
                      {t(`status.${payment.status}`)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-secondary">
                    {new Date(payment.paidAt).toLocaleDateString(locale, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
