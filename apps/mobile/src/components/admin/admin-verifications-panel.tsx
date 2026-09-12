import { AdminFilterChips, AdminStatusBadge } from '@/components/admin/admin-filter-chips';
import { AdminVerificationDetailCard } from '@/components/admin/admin-verification-detail-card';
import { LoadingView } from '@/components/ui/loading-view';
import { useAppToast } from '@/hooks/use-app-toast';
import { getFontFamily } from '@/i18n';
import { adminApi, type VerificationListStatus } from '@/lib/admin-api';
import type { AdminCompanyVerificationDetail, AdminCompanyVerificationSummary } from '@rateq/types';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';

function statusTone(status: string): 'pending' | 'success' | 'danger' | 'neutral' {
  if (status === 'pending' || status === 'revision_requested') return 'pending';
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  return 'neutral';
}

export function AdminVerificationsPanel() {
  const { t } = useTranslation();
  const toast = useAppToast();
  const [filter, setFilter] = useState<VerificationListStatus | 'all'>('pending');
  const [items, setItems] = useState<AdminCompanyVerificationSummary[]>([]);
  const [counts, setCounts] = useState<Partial<Record<VerificationListStatus | 'all', number>>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailById, setDetailById] = useState<Record<string, AdminCompanyVerificationDetail>>({});
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [revisionOpenId, setRevisionOpenId] = useState<string | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');

  const filterKeys = useMemo(
    () =>
      [
        'pending',
        'profile_changes',
        'revision_requested',
        'approved',
        'rejected',
        'all',
      ] as const satisfies ReadonlyArray<VerificationListStatus | 'all'>,
    [],
  );

  const filterOptions = useMemo(
    () =>
      filterKeys.map((value) => ({
        value,
        label:
          value === 'all'
            ? t('admin.filters.all')
            : value === 'profile_changes'
              ? t('admin.filters.profileChanges')
              : value === 'revision_requested'
                ? t('admin.filters.revisionRequested')
                : t(`admin.filters.${value}`),
        count: counts[value],
      })),
    [counts, filterKeys, t],
  );

  const loadCounts = useCallback(async () => {
    const responses = await Promise.all(
      filterKeys.map((status) =>
        adminApi.listCompanyVerifications({
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
        adminApi.listCompanyVerifications({
          status: filter === 'all' ? undefined : filter,
          limit: 40,
        }),
        loadCounts(),
      ]);
      setItems(result.data);
      setDetailById({});
      setExpandedId(null);
      setRevisionOpenId(null);
      setRevisionNotes('');
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

  const ensureDetail = useCallback(
    async (id: string) => {
      if (detailById[id]) return detailById[id];
      setDetailLoadingId(id);
      try {
        const detail = await adminApi.getCompanyVerification(id);
        setDetailById((prev) => ({ ...prev, [id]: detail }));
        return detail;
      } catch (err) {
        toast.apiError(err, t('admin.loadError'));
        return null;
      } finally {
        setDetailLoadingId(null);
      }
    },
    [detailById, t, toast],
  );

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setRevisionOpenId(null);
      setRevisionNotes('');
      return;
    }
    setExpandedId(id);
    setRevisionOpenId(null);
    setRevisionNotes('');
    await ensureDetail(id);
  };

  const refreshDetail = async (id: string) => {
    const detail = await adminApi.getCompanyVerification(id);
    setDetailById((prev) => ({ ...prev, [id]: detail }));
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

  const confirmReject = (id: string) => {
    Alert.alert(t('admin.verifications.rejectTitle'), t('admin.verifications.rejectBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('admin.actions.reject'),
        style: 'destructive',
        onPress: () =>
          void runAction(
            id,
            () => adminApi.updateCompanyVerification(id, { status: 'rejected' }),
            'admin.verifications.rejected',
          ),
      },
    ]);
  };

  const sendRevision = async (id: string) => {
    const notes = revisionNotes.trim();
    if (notes.length < 10) {
      toast.error(t('admin.verifications.revisionNotesRequired'));
      return;
    }
    await runAction(
      id,
      () =>
        adminApi.updateCompanyVerification(id, {
          status: 'revision_requested',
          revisionNotes: notes,
        }),
      'admin.verifications.revisionSent',
    );
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
          const expanded = expandedId === item.id;
          const detail = detailById[item.id];
          const detailLoading = detailLoadingId === item.id;

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
                      {item.city}, {item.country}
                      {item.owner?.email ? ` · ${item.owner.email}` : ''}
                    </Text>
                    <View className="mt-2 flex-row flex-wrap items-center gap-2">
                      <AdminStatusBadge
                        label={t(`admin.verificationStatus.${item.verificationStatus}`)}
                        tone={statusTone(item.verificationStatus)}
                      />
                      {item.profileChangeStatus === 'pending' ? (
                        <View className="rounded-full bg-violet-100 px-2 py-0.5 dark:bg-violet-950/50">
                          <Text
                            className="text-[10px] text-violet-800 dark:text-violet-300"
                            style={{ fontFamily: getFontFamily('semibold'), lineHeight: 14 }}
                          >
                            {t('admin.verifications.profileChangeBadge')}
                          </Text>
                        </View>
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
                  <AdminVerificationDetailCard
                    detail={detail}
                    acting={actingId === item.id}
                    revisionOpen={revisionOpenId === item.id}
                    revisionNotes={revisionNotes}
                    onRevisionNotesChange={setRevisionNotes}
                    onOpenRevision={() => {
                      setRevisionOpenId(item.id);
                      setRevisionNotes('');
                    }}
                    onCloseRevision={() => {
                      setRevisionOpenId(null);
                      setRevisionNotes('');
                    }}
                    onApprove={() =>
                      void runAction(
                        item.id,
                        () => adminApi.updateCompanyVerification(item.id, { status: 'approved' }),
                        'admin.verifications.approved',
                      )
                    }
                    onReject={() => confirmReject(item.id)}
                    onSendRevision={() => void sendRevision(item.id)}
                    onApproveProfileChanges={() =>
                      void runAction(
                        item.id,
                        async () => {
                          await adminApi.approveProfileChanges(item.id);
                          await refreshDetail(item.id);
                        },
                        'admin.verifications.changesApproved',
                      )
                    }
                    onRejectProfileChanges={() =>
                      void runAction(
                        item.id,
                        async () => {
                          await adminApi.rejectProfileChanges(item.id);
                          await refreshDetail(item.id);
                        },
                        'admin.verifications.changesRejected',
                      )
                    }
                  />
                ) : null
              ) : null}
            </View>
          );
        }}
      />
    </View>
  );
}
