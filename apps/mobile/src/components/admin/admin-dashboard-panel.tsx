import { LoadingView } from '@/components/ui/loading-view';
import { useAppToast } from '@/hooks/use-app-toast';
import { getFontFamily } from '@/i18n';
import { adminApi } from '@/lib/admin-api';
import type { AdminPendingActions, AdminPlatformStats, AdminPermission } from '@rateq/types';
import { AdminPermission as Permission, hasAdminPermission } from '@rateq/types';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

export type AdminNavigateTab =
  | 'verifications'
  | 'directory'
  | 'reviews'
  | 'projects'
  | 'invitations';

interface PendingItem {
  key: keyof Omit<AdminPendingActions, 'total'>;
  tab: AdminNavigateTab;
  permission: AdminPermission;
  icon: keyof typeof Ionicons.glyphMap;
}

const PENDING_ITEMS: PendingItem[] = [
  {
    key: 'companyApprovals',
    tab: 'verifications',
    permission: Permission.COMPANIES,
    icon: 'business-outline',
  },
  {
    key: 'profileChanges',
    tab: 'verifications',
    permission: Permission.COMPANIES,
    icon: 'create-outline',
  },
  {
    key: 'reviewModeration',
    tab: 'reviews',
    permission: Permission.MODERATION,
    icon: 'star-outline',
  },
  {
    key: 'replyModeration',
    tab: 'reviews',
    permission: Permission.MODERATION,
    icon: 'chatbubble-outline',
  },
  {
    key: 'projectModeration',
    tab: 'projects',
    permission: Permission.PROJECTS,
    icon: 'folder-open-outline',
  },
  {
    key: 'reviewerInvitationRequests',
    tab: 'invitations',
    permission: Permission.INVITATIONS,
    icon: 'mail-outline',
  },
];

interface AdminDashboardPanelProps {
  permissions?: AdminPermission[];
  onNavigate: (tab: AdminNavigateTab) => void;
}

export function AdminDashboardPanel({ permissions, onNavigate }: AdminDashboardPanelProps) {
  const { t } = useTranslation();
  const toast = useAppToast();
  const [stats, setStats] = useState<AdminPlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setStats(await adminApi.getStats());
    } catch (err) {
      toast.apiError(err, t('admin.loadError'));
    }
  }, [t, toast]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const pendingRows = useMemo(() => {
    const pending = stats?.pendingActions;
    return PENDING_ITEMS.filter((item) => hasAdminPermission(permissions, item.permission)).map(
      (item) => ({
        ...item,
        count: pending?.[item.key] ?? 0,
      }),
    );
  }, [permissions, stats?.pendingActions]);

  if (loading) return <LoadingView />;

  const summary = [
    {
      key: 'companies',
      label: t('admin.dashboard.totalCompanies'),
      value: stats?.totalCompanies ?? 0,
    },
    {
      key: 'reviewers',
      label: t('admin.dashboard.totalReviewers'),
      value: stats?.totalReviewers ?? 0,
    },
    {
      key: 'reviews',
      label: t('admin.dashboard.totalReviews'),
      value: stats?.totalReviews ?? 0,
    },
  ];

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
    >
      <View className="flex-row gap-2">
        {summary.map((card) => (
          <View
            key={card.key}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-3 dark:border-dm-border dark:bg-dm-surface"
          >
            <Text
              className="text-[11px] text-ink-muted dark:text-white/65"
              style={{ fontFamily: getFontFamily('medium'), lineHeight: 14 }}
              numberOfLines={2}
            >
              {card.label}
            </Text>
            <Text
              className="mt-1 text-xl font-bold text-ink dark:text-white"
              style={{ fontFamily: getFontFamily('bold'), lineHeight: 26 }}
            >
              {card.value}
            </Text>
          </View>
        ))}
      </View>

      <View className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-dm-border dark:bg-dm-surface">
        <View className="mb-3 flex-row items-center justify-between">
          <Text
            className="text-base font-semibold text-ink dark:text-white"
            style={{ fontFamily: getFontFamily('semibold') }}
          >
            {t('admin.dashboard.pendingTitle')}
          </Text>
          <Text
            className="text-sm font-semibold text-brand-500"
            style={{ fontFamily: getFontFamily('semibold') }}
          >
            {stats?.pendingActions.total ?? 0}
          </Text>
        </View>

        {pendingRows.length === 0 ? (
          <Text
            className="text-sm text-ink-muted dark:text-white/70"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {t('admin.empty')}
          </Text>
        ) : (
          <View className="gap-2">
            {pendingRows.map((row) => (
              <Pressable
                key={row.key}
                onPress={() => onNavigate(row.tab)}
                className="flex-row items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-dm-border dark:bg-dm-elevated"
              >
                <View className="h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-dm-surface">
                  <Ionicons name={row.icon} size={16} color="#8E2157" />
                </View>
                <Text
                  className="flex-1 text-sm text-ink dark:text-white"
                  style={{ fontFamily: getFontFamily('medium') }}
                  numberOfLines={1}
                >
                  {t(`admin.dashboard.pending.${row.key}`)}
                </Text>
                <View className="min-w-[28px] items-center rounded-full bg-brand-500 px-2 py-0.5">
                  <Text
                    className="text-xs text-white"
                    style={{ fontFamily: getFontFamily('semibold'), lineHeight: 14 }}
                  >
                    {row.count}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
