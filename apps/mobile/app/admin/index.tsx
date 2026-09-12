import {
  AdminDashboardPanel,
  type AdminNavigateTab,
} from '@/components/admin/admin-dashboard-panel';
import { AdminDirectoryPanel } from '@/components/admin/admin-directory-panel';
import { AdminInvitationsPanel } from '@/components/admin/admin-invitations-panel';
import { AdminProjectsPanel } from '@/components/admin/admin-projects-panel';
import { AdminReviewsPanel } from '@/components/admin/admin-reviews-panel';
import { AdminVerificationsPanel } from '@/components/admin/admin-verifications-panel';
import { ProfileSubscreenLayout } from '@/components/profile/profile-subscreen-layout';
import { LoadingView } from '@/components/ui/loading-view';
import { useAuth } from '@/context/auth-context';
import { getFontFamily } from '@/i18n';
import { cn } from '@/lib/cn';
import { AdminPermission, UserRole, hasAdminPermission } from '@rateq/types';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

type AdminTabId = 'dashboard' | AdminNavigateTab;

interface AdminTab {
  id: AdminTabId;
  permission: AdminPermission | 'ANY';
  labelKey: string;
}

const ADMIN_TABS: AdminTab[] = [
  {
    id: 'dashboard',
    permission: 'ANY',
    labelKey: 'admin.tabs.dashboard',
  },
  {
    id: 'verifications',
    permission: AdminPermission.COMPANIES,
    labelKey: 'admin.tabs.verifications',
  },
  {
    id: 'directory',
    permission: AdminPermission.DIRECTORY,
    labelKey: 'admin.tabs.directory',
  },
  {
    id: 'reviews',
    permission: AdminPermission.MODERATION,
    labelKey: 'admin.tabs.reviews',
  },
  {
    id: 'projects',
    permission: AdminPermission.PROJECTS,
    labelKey: 'admin.tabs.projects',
  },
  {
    id: 'invitations',
    permission: AdminPermission.INVITATIONS,
    labelKey: 'admin.tabs.invitations',
  },
];

export default function AdminIndexScreen() {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const permissions = user?.adminPermissions;

  const availableTabs = useMemo(
    () =>
      ADMIN_TABS.filter((tab) => {
        if (tab.permission === 'ANY') {
          return ADMIN_TABS.some(
            (candidate) =>
              candidate.permission !== 'ANY' &&
              hasAdminPermission(permissions, candidate.permission),
          );
        }
        return hasAdminPermission(permissions, tab.permission);
      }),
    [permissions],
  );

  const [activeTab, setActiveTab] = useState<AdminTabId | null>(null);
  const currentTab =
    activeTab && availableTabs.some((tab) => tab.id === activeTab)
      ? activeTab
      : (availableTabs[0]?.id ?? null);

  if (isLoading) return <LoadingView />;

  if (!user || user.role !== UserRole.ADMIN) {
    return (
      <ProfileSubscreenLayout title={t('admin.title')}>
        <Text
          className="p-4 text-sm text-ink-muted dark:text-white/70"
          style={{ fontFamily: getFontFamily('regular') }}
        >
          {t('admin.accessDenied')}
        </Text>
      </ProfileSubscreenLayout>
    );
  }

  if (availableTabs.length === 0) {
    return (
      <ProfileSubscreenLayout title={t('admin.title')}>
        <Text
          className="p-4 text-sm text-ink-muted dark:text-white/70"
          style={{ fontFamily: getFontFamily('regular') }}
        >
          {t('admin.noPermissions')}
        </Text>
      </ProfileSubscreenLayout>
    );
  }

  return (
    <ProfileSubscreenLayout title={t('admin.title')}>
      <View className="border-b border-slate-200 bg-slate-50 dark:border-dm-border dark:bg-dm-elevated">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 8,
            alignItems: 'stretch',
          }}
        >
          {availableTabs.map((tab) => {
            const active = tab.id === currentTab;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={cn(
                  'min-h-[44px] items-center justify-center border-b-2 px-3.5',
                  active ? 'border-brand-500 bg-white dark:bg-dm-surface' : 'border-transparent',
                )}
              >
                <Text
                  className={cn(
                    'text-[13px]',
                    active ? 'text-brand-500' : 'text-ink-muted dark:text-white/60',
                  )}
                  style={{
                    fontFamily: getFontFamily(active ? 'semibold' : 'medium'),
                    lineHeight: 18,
                  }}
                  numberOfLines={1}
                >
                  {t(tab.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View className="flex-1">
        {currentTab === 'dashboard' ? (
          <AdminDashboardPanel permissions={permissions} onNavigate={(tab) => setActiveTab(tab)} />
        ) : null}
        {currentTab === 'verifications' ? <AdminVerificationsPanel /> : null}
        {currentTab === 'directory' ? <AdminDirectoryPanel /> : null}
        {currentTab === 'reviews' ? <AdminReviewsPanel /> : null}
        {currentTab === 'projects' ? <AdminProjectsPanel /> : null}
        {currentTab === 'invitations' ? <AdminInvitationsPanel /> : null}
      </View>
    </ProfileSubscreenLayout>
  );
}
