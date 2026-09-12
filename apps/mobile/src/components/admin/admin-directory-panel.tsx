import {
  AdminDirectoryCompanyDetail,
  AdminDirectoryReviewerDetail,
} from '@/components/admin/admin-directory-detail-card';
import { AdminFilterChips, AdminStatusBadge } from '@/components/admin/admin-filter-chips';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingView } from '@/components/ui/loading-view';
import { useAuth } from '@/context/auth-context';
import { useAppToast } from '@/hooks/use-app-toast';
import { getFontFamily } from '@/i18n';
import { adminApi } from '@/lib/admin-api';
import type {
  AdminCompanyDetail,
  AdminCompanyListItem,
  AdminUserDetail,
  UserProfile,
} from '@rateq/types';
import { AdminPermission, hasAdminPermission } from '@rateq/types';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';

type DirectoryTab = 'companies' | 'reviewers';

const PAGE_SIZE = 15;

function verificationTone(status: string): 'pending' | 'success' | 'danger' | 'neutral' {
  if (status === 'pending' || status === 'revision_requested') return 'pending';
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  return 'neutral';
}

export function AdminDirectoryPanel() {
  const { t } = useTranslation();
  const toast = useAppToast();
  const { user } = useAuth();
  const canModerateReviews = hasAdminPermission(user?.adminPermissions, AdminPermission.MODERATION);

  const [tab, setTab] = useState<DirectoryTab>('companies');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [companies, setCompanies] = useState<AdminCompanyListItem[]>([]);
  const [reviewers, setReviewers] = useState<UserProfile[]>([]);
  const [counts, setCounts] = useState<{ companies?: number; reviewers?: number }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [companyDetailById, setCompanyDetailById] = useState<Record<string, AdminCompanyDetail>>(
    {},
  );
  const [reviewerDetailById, setReviewerDetailById] = useState<Record<string, AdminUserDetail>>({});
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);

  const tabOptions = useMemo(
    () => [
      {
        value: 'companies' as const,
        label: t('admin.directory.companies'),
        count: counts.companies,
      },
      {
        value: 'reviewers' as const,
        label: t('admin.directory.reviewers'),
        count: counts.reviewers,
      },
    ],
    [counts.companies, counts.reviewers, t],
  );

  const resetSelection = useCallback(() => {
    setExpandedId(null);
    setCompanyDetailById({});
    setReviewerDetailById({});
    setDetailLoadingId(null);
  }, []);

  const loadCounts = useCallback(async () => {
    try {
      const stats = await adminApi.getStats();
      setCounts({
        companies: stats.totalCompanies,
        reviewers: stats.totalReviewers,
      });
    } catch {
      // List still works without badge totals.
    }
  }, []);

  const load = useCallback(async () => {
    try {
      if (tab === 'companies') {
        const [result] = await Promise.all([
          adminApi.listDirectoryCompanies({
            search: appliedQuery || undefined,
            page,
            limit: PAGE_SIZE,
          }),
          loadCounts(),
        ]);
        setCompanies(result.data);
        setTotalPages(Math.max(1, result.meta.totalPages));
      } else {
        const [result] = await Promise.all([
          adminApi.listDirectoryReviewers({
            search: appliedQuery || undefined,
            page,
            limit: PAGE_SIZE,
          }),
          loadCounts(),
        ]);
        setReviewers(result.data);
        setTotalPages(Math.max(1, result.meta.totalPages));
      }
    } catch (err) {
      toast.apiError(err, t('admin.loadError'));
    }
  }, [tab, appliedQuery, page, loadCounts, t, toast]);

  useEffect(() => {
    resetSelection();
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load, resetSelection]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onSearch = () => {
    Keyboard.dismiss();
    setPage(1);
    setAppliedQuery(query.trim());
  };

  const onTabChange = (next: DirectoryTab) => {
    setTab(next);
    setQuery('');
    setAppliedQuery('');
    setPage(1);
  };

  const ensureCompanyDetail = useCallback(
    async (id: string) => {
      if (companyDetailById[id]) return companyDetailById[id];
      setDetailLoadingId(id);
      try {
        const detail = await adminApi.getCompanyDetail(id);
        setCompanyDetailById((prev) => ({ ...prev, [id]: detail }));
        return detail;
      } catch (err) {
        toast.apiError(err, t('admin.loadError'));
        return null;
      } finally {
        setDetailLoadingId(null);
      }
    },
    [companyDetailById, t, toast],
  );

  const ensureReviewerDetail = useCallback(
    async (id: string) => {
      if (reviewerDetailById[id]) return reviewerDetailById[id];
      setDetailLoadingId(id);
      try {
        const detail = await adminApi.getUserDetail(id);
        setReviewerDetailById((prev) => ({ ...prev, [id]: detail }));
        return detail;
      } catch (err) {
        toast.apiError(err, t('admin.loadError'));
        return null;
      } finally {
        setDetailLoadingId(null);
      }
    },
    [reviewerDetailById, t, toast],
  );

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (tab === 'companies') {
      await ensureCompanyDetail(id);
    } else {
      await ensureReviewerDetail(id);
    }
  };

  const refreshCompanyDetail = async (id: string) => {
    const detail = await adminApi.getCompanyDetail(id);
    setCompanyDetailById((prev) => ({ ...prev, [id]: detail }));
  };

  const refreshReviewerDetail = async (id: string) => {
    const detail = await adminApi.getUserDetail(id);
    setReviewerDetailById((prev) => ({ ...prev, [id]: detail }));
  };

  const runAction = async (
    id: string,
    action: () => Promise<unknown>,
    successKey: string,
    options?: { reloadList?: boolean; clearSelection?: boolean },
  ) => {
    setActingId(id);
    try {
      await action();
      toast.success(t(successKey));
      if (options?.clearSelection) {
        setExpandedId(null);
      }
      if (options?.reloadList !== false) {
        await load();
      }
    } catch (err) {
      toast.apiError(err, t('admin.actionError'));
    } finally {
      setActingId(null);
    }
  };

  const confirmDeleteCompany = (company: AdminCompanyDetail) => {
    Alert.alert(
      t('admin.directory.deleteCompanyTitle'),
      `${t('admin.directory.deleteCompanyConfirm', { name: company.name })}\n\n• ${t('admin.directory.deleteCompanyBulletData')}\n• ${t('admin.directory.deleteCompanyBulletOwnerKept')}\n• ${t('admin.directory.deleteCompanyBulletCompleteProfile')}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.directory.deleteCompany'),
          style: 'destructive',
          onPress: () =>
            void runAction(
              company.id,
              () => adminApi.deleteCompany(company.id),
              'admin.directory.deleteCompanySuccess',
              { clearSelection: true },
            ),
        },
      ],
    );
  };

  const confirmDeleteOwner = (company: AdminCompanyDetail) => {
    if (!company.ownerId) return;
    const email = company.ownerEmail ?? company.email ?? company.name;
    Alert.alert(
      t('admin.directory.deleteOwnerTitle'),
      `${t('admin.directory.deleteOwnerConfirm', { email })}\n\n• ${t('admin.directory.deleteOwnerBulletAccount')}\n• ${t('admin.directory.deleteOwnerBulletCompanies')}\n• ${t('admin.directory.deleteOwnerBulletFirebase')}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.directory.deleteOwner'),
          style: 'destructive',
          onPress: () =>
            void runAction(
              company.id,
              () => adminApi.deleteUser(company.ownerId!),
              'admin.directory.deleteOwnerSuccess',
              { clearSelection: true },
            ),
        },
      ],
    );
  };

  const confirmDeleteReviewer = (reviewer: AdminUserDetail) => {
    Alert.alert(
      t('admin.directory.deleteReviewerTitle'),
      `${t('admin.directory.deleteReviewerConfirm', { email: reviewer.email })}\n\n• ${t('admin.directory.deleteReviewerBulletReviews')}\n• ${t('admin.directory.deleteReviewerBulletFirebase')}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.directory.deleteAccount'),
          style: 'destructive',
          onPress: () =>
            void runAction(
              reviewer.id,
              () => adminApi.deleteUser(reviewer.id),
              'admin.directory.deleteSuccess',
              { clearSelection: true },
            ),
        },
      ],
    );
  };

  const confirmDeleteReview = (entityId: string, reviewId: string) => {
    Alert.alert(t('admin.reviews.deleteTitle'), t('admin.reviews.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('admin.actions.delete'),
        style: 'destructive',
        onPress: () =>
          void runAction(
            entityId,
            async () => {
              await adminApi.deleteReview(reviewId);
              if (tab === 'companies') {
                await refreshCompanyDetail(entityId);
              } else {
                await refreshReviewerDetail(entityId);
              }
            },
            'admin.reviews.deleted',
            { reloadList: false },
          ),
      },
    ]);
  };

  const confirmDeleteReply = (entityId: string, reviewId: string) => {
    Alert.alert(t('admin.directory.deleteReplyTitle'), t('admin.directory.deleteReplyBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('admin.directory.deleteReply'),
        style: 'destructive',
        onPress: () =>
          void runAction(
            entityId,
            async () => {
              await adminApi.deleteReviewReply(reviewId);
              if (tab === 'companies') {
                await refreshCompanyDetail(entityId);
              } else {
                await refreshReviewerDetail(entityId);
              }
            },
            'admin.directory.replyDeleted',
            { reloadList: false },
          ),
      },
    ]);
  };

  const paginationFooter =
    totalPages > 1 ? (
      <View className="mt-2 flex-row items-center justify-between gap-2 px-1 pb-2">
        <Button
          title={t('admin.directory.previous')}
          variant="outline"
          size="md"
          className="min-w-[100px]"
          disabled={page <= 1 || loading}
          onPress={() => setPage((p) => Math.max(1, p - 1))}
        />
        <Text
          className="text-xs text-ink-muted dark:text-white/65"
          style={{ fontFamily: getFontFamily('medium') }}
        >
          {t('admin.directory.pageOf', { page, total: totalPages })}
        </Text>
        <Button
          title={t('admin.directory.next')}
          variant="outline"
          size="md"
          className="min-w-[100px]"
          disabled={page >= totalPages || loading}
          onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      </View>
    ) : null;

  if (loading) return <LoadingView />;

  return (
    <View className="flex-1">
      <AdminFilterChips options={tabOptions} value={tab} onChange={onTabChange} />
      <View className="flex-row items-center gap-2 px-4 pb-2 pt-1">
        <Input
          className="flex-1 rounded-full border-slate-200"
          placeholder={t('admin.directory.searchPlaceholder')}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={onSearch}
          returnKeyType="search"
        />
        <Pressable
          onPress={onSearch}
          className="h-11 w-11 items-center justify-center rounded-full bg-brand-500"
        >
          <Ionicons name="search" size={18} color="#ffffff" />
        </Pressable>
      </View>

      {tab === 'companies' ? (
        <FlatList
          data={companies}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
          }
          ListEmptyComponent={
            <Text
              className="py-10 text-center text-sm text-ink-muted dark:text-white/70"
              style={{ fontFamily: getFontFamily('regular') }}
            >
              {t('admin.empty')}
            </Text>
          }
          ListFooterComponent={paginationFooter}
          renderItem={({ item }) => {
            const expanded = expandedId === item.id;
            const detail = companyDetailById[item.id];
            const detailLoading = detailLoadingId === item.id;
            const statusKey = `admin.verificationStatus.${item.verificationStatus}`;
            const statusLabel = t(statusKey, { defaultValue: item.verificationStatus });

            return (
              <View className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-dm-border dark:bg-dm-surface">
                <Pressable onPress={() => void toggleExpand(item.id)}>
                  <View className="flex-row items-start gap-3">
                    <View className="h-11 w-11 overflow-hidden rounded-xl bg-slate-100 dark:bg-dm-elevated">
                      {item.logo ? (
                        <Image
                          source={{ uri: item.logo }}
                          className="h-full w-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="h-full w-full items-center justify-center">
                          <Ionicons name="business-outline" size={18} color="#8E2157" />
                        </View>
                      )}
                    </View>
                    <View className="min-w-0 flex-1">
                      <View className="flex-row items-start justify-between gap-2">
                        <Text
                          className="flex-1 text-base font-semibold text-ink dark:text-white"
                          style={{ fontFamily: getFontFamily('semibold') }}
                          numberOfLines={2}
                        >
                          {item.name}
                        </Text>
                        <Ionicons
                          name={expanded ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color="#64748b"
                        />
                      </View>
                      <Text
                        className="mt-1 text-xs text-ink-muted dark:text-white/65"
                        style={{ fontFamily: getFontFamily('regular') }}
                      >
                        {[item.city, item.country].filter(Boolean).join(', ')}
                      </Text>
                      <Text
                        className="mt-0.5 text-xs text-ink-muted dark:text-white/65"
                        style={{ fontFamily: getFontFamily('regular') }}
                        numberOfLines={1}
                      >
                        {item.ownerEmail
                          ? t('admin.directory.ownerEmail', { email: item.ownerEmail })
                          : t('admin.directory.noOwnerAccount')}
                        {item.ownerIsActive === false ? ` · ${t('admin.directory.inactive')}` : ''}
                      </Text>
                      <Text
                        className="mt-0.5 text-xs text-ink-muted dark:text-white/60"
                        style={{ fontFamily: getFontFamily('regular') }}
                      >
                        {t('admin.verifications.metrics', {
                          reviews: item.reviewCount,
                          visits: item.pageVisitCount,
                        })}
                      </Text>
                      <View className="mt-2 flex-row flex-wrap items-center gap-2">
                        <AdminStatusBadge
                          label={statusLabel}
                          tone={verificationTone(item.verificationStatus)}
                        />
                        {item.showVerifiedStamp ? (
                          <AdminStatusBadge label={t('admin.directory.stampOn')} tone="success" />
                        ) : null}
                        {item.isTrusted ? (
                          <AdminStatusBadge label={t('admin.directory.trustedOn')} tone="pending" />
                        ) : null}
                      </View>
                    </View>
                  </View>
                </Pressable>

                {expanded ? (
                  detailLoading && !detail ? (
                    <View className="mt-4 items-center py-6">
                      <ActivityIndicator color="#8E2157" />
                    </View>
                  ) : detail ? (
                    <AdminDirectoryCompanyDetail
                      detail={detail}
                      acting={actingId === item.id}
                      canModerateReviews={canModerateReviews}
                      onToggleStamp={() =>
                        void runAction(
                          item.id,
                          async () => {
                            await adminApi.updateCompanyStamp(item.id, !detail.showVerifiedStamp);
                            await refreshCompanyDetail(item.id);
                          },
                          detail.showVerifiedStamp
                            ? 'admin.directory.stampRemoved'
                            : 'admin.directory.stampEnabled',
                          { reloadList: true },
                        )
                      }
                      onToggleTrusted={() =>
                        void runAction(
                          item.id,
                          async () => {
                            await adminApi.updateCompanyTrusted(item.id, !detail.isTrusted);
                            await refreshCompanyDetail(item.id);
                          },
                          detail.isTrusted
                            ? 'admin.directory.trustedRemoved'
                            : 'admin.directory.trustedEnabled',
                          { reloadList: true },
                        )
                      }
                      onDeleteCompany={() => confirmDeleteCompany(detail)}
                      onToggleOwnerActive={
                        detail.ownerId
                          ? () =>
                              void runAction(
                                item.id,
                                async () => {
                                  await adminApi.updateUser(detail.ownerId!, {
                                    isActive: detail.ownerIsActive === false,
                                  });
                                  await refreshCompanyDetail(item.id);
                                },
                                detail.ownerIsActive === false
                                  ? 'admin.directory.activateSuccess'
                                  : 'admin.directory.deactivateSuccess',
                                { reloadList: true },
                              )
                          : undefined
                      }
                      onDeleteOwner={detail.ownerId ? () => confirmDeleteOwner(detail) : undefined}
                      onDeleteReview={(reviewId) => confirmDeleteReview(item.id, reviewId)}
                      onDeleteReply={(reviewId) => confirmDeleteReply(item.id, reviewId)}
                    />
                  ) : null
                ) : null}
              </View>
            );
          }}
        />
      ) : (
        <FlatList
          data={reviewers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
          }
          ListEmptyComponent={
            <Text
              className="py-10 text-center text-sm text-ink-muted dark:text-white/70"
              style={{ fontFamily: getFontFamily('regular') }}
            >
              {t('admin.empty')}
            </Text>
          }
          ListFooterComponent={paginationFooter}
          renderItem={({ item }) => {
            const expanded = expandedId === item.id;
            const detail = reviewerDetailById[item.id];
            const detailLoading = detailLoadingId === item.id;
            const displayName = item.fullName ?? item.displayName ?? item.email;

            return (
              <View className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-dm-border dark:bg-dm-surface">
                <Pressable onPress={() => void toggleExpand(item.id)}>
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="min-w-0 flex-1">
                      <View className="flex-row items-start justify-between gap-2">
                        <Text
                          className="flex-1 text-base font-semibold text-ink dark:text-white"
                          style={{ fontFamily: getFontFamily('semibold') }}
                          numberOfLines={2}
                        >
                          {displayName}
                        </Text>
                        <Ionicons
                          name={expanded ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color="#64748b"
                        />
                      </View>
                      <Text
                        className="mt-1 text-xs text-ink-muted dark:text-white/65"
                        style={{ fontFamily: getFontFamily('regular') }}
                      >
                        {item.email}
                      </Text>
                      {item.phone ? (
                        <Text
                          className="mt-0.5 text-xs text-ink-muted dark:text-white/65"
                          style={{ fontFamily: getFontFamily('regular') }}
                        >
                          {item.phone}
                        </Text>
                      ) : null}
                      <Text
                        className="mt-1 text-xs text-ink-muted dark:text-white/65"
                        style={{ fontFamily: getFontFamily('regular') }}
                      >
                        {t('admin.directory.reviewsCount', { count: item.reviewCount })}
                        {!item.isActive ? ` · ${t('admin.directory.inactive')}` : ''}
                      </Text>
                      <View className="mt-2 flex-row flex-wrap gap-2">
                        <AdminStatusBadge
                          label={
                            item.isActive
                              ? t('admin.directory.active')
                              : t('admin.directory.inactive')
                          }
                          tone={item.isActive ? 'success' : 'danger'}
                        />
                        <AdminStatusBadge
                          label={
                            item.isProfileComplete
                              ? t('admin.directory.profileComplete')
                              : t('admin.directory.profileIncomplete')
                          }
                          tone={item.isProfileComplete ? 'success' : 'pending'}
                        />
                      </View>
                    </View>
                  </View>
                </Pressable>

                {expanded ? (
                  detailLoading && !detail ? (
                    <View className="mt-4 items-center py-6">
                      <ActivityIndicator color="#8E2157" />
                    </View>
                  ) : detail ? (
                    <AdminDirectoryReviewerDetail
                      detail={detail}
                      acting={actingId === item.id}
                      canModerateReviews={canModerateReviews}
                      onToggleActive={() =>
                        void runAction(
                          item.id,
                          async () => {
                            await adminApi.updateUser(item.id, {
                              isActive: !detail.isActive,
                            });
                            await refreshReviewerDetail(item.id);
                          },
                          detail.isActive
                            ? 'admin.directory.deactivateSuccess'
                            : 'admin.directory.activateSuccess',
                          { reloadList: true },
                        )
                      }
                      onDeleteAccount={() => confirmDeleteReviewer(detail)}
                      onDeleteReview={(reviewId) => confirmDeleteReview(item.id, reviewId)}
                      onDeleteReply={(reviewId) => confirmDeleteReply(item.id, reviewId)}
                    />
                  ) : null
                ) : null}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
