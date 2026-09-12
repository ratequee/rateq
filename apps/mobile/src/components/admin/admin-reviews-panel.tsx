import { AdminActionButtons } from '@/components/admin/admin-action-buttons';
import { AdminFilterChips, AdminStatusBadge } from '@/components/admin/admin-filter-chips';
import { LoadingView } from '@/components/ui/loading-view';
import { useAppToast } from '@/hooks/use-app-toast';
import { getFontFamily } from '@/i18n';
import { adminApi } from '@/lib/admin-api';
import { ReviewStatus, type ReviewPublic } from '@rateq/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';

const ACTIONABLE: ReviewStatus[] = [
  ReviewStatus.PENDING,
  ReviewStatus.MODIFIED,
  ReviewStatus.PROCEEDED,
];

function reviewTone(status: ReviewStatus): 'pending' | 'success' | 'danger' | 'neutral' {
  if (status === ReviewStatus.PENDING || status === ReviewStatus.MODIFIED) return 'pending';
  if (status === ReviewStatus.APPROVED || status === ReviewStatus.PROCEEDED) return 'success';
  if (status === ReviewStatus.REJECTED || status === ReviewStatus.DELETED) return 'danger';
  return 'neutral';
}

export function AdminReviewsPanel() {
  const { t } = useTranslation();
  const toast = useAppToast();
  const [filter, setFilter] = useState<string>('PENDING');
  const [items, setItems] = useState<ReviewPublic[]>([]);
  const [counts, setCounts] = useState<Partial<Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const filterKeys = useMemo(
    () => ['PENDING', 'APPROVED', 'REJECTED', 'RESOLUTION_PENDING', 'all'] as const,
    [],
  );

  const filterOptions = useMemo(
    () =>
      filterKeys.map((value) => ({
        value,
        label:
          value === 'all'
            ? t('admin.filters.all')
            : value === 'RESOLUTION_PENDING'
              ? t('admin.filters.resolutionPending')
              : t(`admin.filters.${value.toLowerCase()}`),
        count: counts[value],
      })),
    [counts, filterKeys, t],
  );

  const loadCounts = useCallback(async () => {
    const responses = await Promise.all(
      filterKeys.map((status) =>
        adminApi.listModerationReviews({
          status: status === 'all' ? undefined : status,
          page: 1,
          limit: 1,
        }),
      ),
    );
    setCounts(
      Object.fromEntries(
        filterKeys.map((status, index) => [status, responses[index]?.meta.total ?? 0]),
      ),
    );
  }, [filterKeys]);

  const load = useCallback(async () => {
    try {
      const [result] = await Promise.all([
        adminApi.listModerationReviews({
          status: filter === 'all' ? undefined : filter,
          limit: 40,
        }),
        loadCounts(),
      ]);
      setItems(result.data);
    } catch (err) {
      toast.apiError(err, t('admin.loadError'));
    }
  }, [filter, loadCounts, t, toast]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const runAction = async (id: string, action: () => Promise<unknown>, successKey: string) => {
    setActingId(id);
    try {
      await action();
      toast.success(t(successKey));
      await load();
    } catch (err) {
      toast.apiError(err, t('admin.actionError'));
    } finally {
      setActingId(null);
    }
  };

  if (loading) return <LoadingView />;

  return (
    <View className="flex-1">
      <AdminFilterChips options={filterOptions} value={filter} onChange={setFilter} />
      <FlatList
        data={items}
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
        renderItem={({ item }) => {
          const canModerate = ACTIONABLE.includes(item.status);
          const replyPending = item.reply?.status === 'PENDING';

          return (
            <View className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-dm-border dark:bg-dm-surface">
              <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1">
                  <Text
                    className="text-base font-semibold text-ink dark:text-white"
                    style={{ fontFamily: getFontFamily('semibold') }}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <Text
                    className="mt-1 text-xs text-ink-muted dark:text-white/65"
                    style={{ fontFamily: getFontFamily('regular') }}
                  >
                    {item.company?.name ?? '—'} · ★ {item.rating}
                  </Text>
                </View>
                <AdminStatusBadge label={item.status} tone={reviewTone(item.status)} />
              </View>
              <Text
                className="mt-3 text-sm text-ink-muted dark:text-white/75"
                style={{ fontFamily: getFontFamily('regular'), lineHeight: 20 }}
                numberOfLines={4}
              >
                {item.content}
              </Text>

              {canModerate ? (
                <AdminActionButtons
                  acting={actingId === item.id}
                  approveLabel={t('admin.actions.approve')}
                  rejectLabel={t('admin.actions.reject')}
                  resolveLabel={t('admin.actions.resolve')}
                  deleteLabel={t('admin.actions.delete')}
                  onApprove={() =>
                    void runAction(
                      item.id,
                      () => adminApi.approveReview(item.id),
                      'admin.reviews.approved',
                    )
                  }
                  onReject={() =>
                    Alert.alert(t('admin.reviews.rejectTitle'), t('admin.reviews.rejectBody'), [
                      { text: t('common.cancel'), style: 'cancel' },
                      {
                        text: t('admin.actions.reject'),
                        style: 'destructive',
                        onPress: () =>
                          void runAction(
                            item.id,
                            () => adminApi.rejectReview(item.id),
                            'admin.reviews.rejected',
                          ),
                      },
                    ])
                  }
                  onResolve={() =>
                    void runAction(
                      item.id,
                      () => adminApi.resolveReview(item.id),
                      'admin.reviews.resolved',
                    )
                  }
                  onDelete={() =>
                    Alert.alert(t('admin.reviews.deleteTitle'), t('admin.reviews.deleteBody'), [
                      { text: t('common.cancel'), style: 'cancel' },
                      {
                        text: t('admin.actions.delete'),
                        style: 'destructive',
                        onPress: () =>
                          void runAction(
                            item.id,
                            () => adminApi.deleteReview(item.id),
                            'admin.reviews.deleted',
                          ),
                      },
                    ])
                  }
                />
              ) : null}

              {replyPending ? (
                <View className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-dm-elevated">
                  <Text
                    className="text-xs font-semibold text-ink dark:text-white"
                    style={{ fontFamily: getFontFamily('semibold') }}
                  >
                    {t('admin.reviews.pendingReply')}
                  </Text>
                  <Text
                    className="mt-1 text-sm text-ink-muted dark:text-white/75"
                    style={{ fontFamily: getFontFamily('regular') }}
                    numberOfLines={3}
                  >
                    {item.reply?.content}
                  </Text>
                  <AdminActionButtons
                    acting={actingId === item.id}
                    approveLabel={t('admin.reviews.approveReply')}
                    rejectLabel={t('admin.reviews.rejectReply')}
                    onApprove={() =>
                      void runAction(
                        item.id,
                        () => adminApi.approveReviewReply(item.id),
                        'admin.reviews.replyApproved',
                      )
                    }
                    onReject={() =>
                      void runAction(
                        item.id,
                        () => adminApi.rejectReviewReply(item.id),
                        'admin.reviews.replyRejected',
                      )
                    }
                  />
                </View>
              ) : null}
            </View>
          );
        }}
      />
    </View>
  );
}
