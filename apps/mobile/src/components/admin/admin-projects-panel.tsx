import { AdminProjectsDetailCard } from '@/components/admin/admin-projects-detail-card';
import { AdminFilterChips, AdminStatusBadge } from '@/components/admin/admin-filter-chips';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingView } from '@/components/ui/loading-view';
import { useAppToast } from '@/hooks/use-app-toast';
import { getFontFamily } from '@/i18n';
import { adminApi } from '@/lib/admin-api';
import { CompanyProjectStatus, type AdminCompanyProjectListItem } from '@rateq/types';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';

const PAGE_SIZE = 20;

function projectTone(status: CompanyProjectStatus): 'pending' | 'success' | 'danger' | 'neutral' {
  if (status === CompanyProjectStatus.PENDING) return 'pending';
  if (status === CompanyProjectStatus.APPROVED) return 'success';
  if (status === CompanyProjectStatus.REJECTED) return 'danger';
  return 'neutral';
}

export function AdminProjectsPanel() {
  const { t, i18n } = useTranslation();
  const toast = useAppToast();
  const [filter, setFilter] = useState<string>('PENDING');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState<AdminCompanyProjectListItem[]>([]);
  const [counts, setCounts] = useState<Partial<Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filterKeys = useMemo(() => ['PENDING', 'APPROVED', 'REJECTED', 'all'] as const, []);

  const filterOptions = useMemo(
    () =>
      filterKeys.map((value) => ({
        value,
        label:
          value === 'all'
            ? t('admin.filters.all')
            : t(`admin.projects.status.${value}`, {
                defaultValue: t(`admin.filters.${value.toLowerCase()}`),
              }),
        count: counts[value],
      })),
    [counts, filterKeys, t],
  );

  const loadCounts = useCallback(async () => {
    const responses = await Promise.all(
      filterKeys.map((status) =>
        adminApi.listModerationProjects({
          status: status === 'all' ? undefined : status,
          search: appliedQuery || undefined,
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
  }, [appliedQuery, filterKeys]);

  const load = useCallback(async () => {
    try {
      const [result] = await Promise.all([
        adminApi.listModerationProjects({
          status: filter === 'all' ? undefined : filter,
          search: appliedQuery || undefined,
          page,
          limit: PAGE_SIZE,
        }),
        loadCounts(),
      ]);
      setItems(result.data);
      setTotalPages(Math.max(1, result.meta.totalPages));
      if (result.meta.totalPages > 0 && page > result.meta.totalPages) {
        setPage(1);
      }
    } catch (err) {
      toast.apiError(err, t('admin.loadError'));
    }
  }, [filter, appliedQuery, page, loadCounts, t, toast]);

  useEffect(() => {
    setExpandedId(null);
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

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

  const onClearSearch = () => {
    setQuery('');
    setAppliedQuery('');
    setPage(1);
  };

  const onFilterChange = (value: string) => {
    setFilter(value);
    setPage(1);
  };

  const runAction = async (id: string, action: () => Promise<unknown>, successKey: string) => {
    setActingId(id);
    try {
      await action();
      toast.success(t(successKey));
      setExpandedId(null);
      await load();
    } catch (err) {
      toast.apiError(err, t('admin.actionError'));
    } finally {
      setActingId(null);
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert(t('admin.projects.deleteTitle'), t('admin.projects.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('admin.actions.delete'),
        style: 'destructive',
        onPress: () =>
          void runAction(id, () => adminApi.deleteProject(id), 'admin.projects.deleted'),
      },
    ]);
  };

  const paginationFooter =
    totalPages > 1 ? (
      <View className="mt-2 flex-row items-center justify-between gap-2 px-1 pb-2">
        <Button
          title={t('admin.projects.previous')}
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
          {t('admin.projects.pageOf', { page, total: totalPages })}
        </Text>
        <Button
          title={t('admin.projects.next')}
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
      <AdminFilterChips options={filterOptions} value={filter} onChange={onFilterChange} />
      <View className="flex-row items-center gap-2 px-4 pb-2 pt-1">
        <Input
          className="flex-1 rounded-full border-slate-200"
          placeholder={t('admin.projects.searchPlaceholder')}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={onSearch}
          returnKeyType="search"
        />
        {appliedQuery || query ? (
          <Pressable
            onPress={onClearSearch}
            className="h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-dm-border dark:bg-dm-elevated"
          >
            <Ionicons name="close" size={18} color="#64748b" />
          </Pressable>
        ) : null}
        <Pressable
          onPress={onSearch}
          className="h-11 w-11 items-center justify-center rounded-full bg-brand-500"
        >
          <Ionicons name="search" size={18} color="#ffffff" />
        </Pressable>
      </View>

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
        ListFooterComponent={paginationFooter}
        renderItem={({ item }) => {
          const expanded = expandedId === item.id;

          return (
            <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-dm-border dark:bg-dm-surface">
              <Pressable onPress={() => setExpandedId(expanded ? null : item.id)}>
                <View className="flex-row items-start gap-3 p-3">
                  <Image
                    source={{ uri: item.imageUrl }}
                    className="h-16 w-20 rounded-lg bg-slate-100"
                    resizeMode="cover"
                  />
                  <View className="min-w-0 flex-1">
                    <View className="flex-row items-start justify-between gap-2">
                      <Text
                        className="flex-1 text-base font-semibold text-ink dark:text-white"
                        style={{ fontFamily: getFontFamily('semibold') }}
                        numberOfLines={2}
                      >
                        {item.title}
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
                      numberOfLines={1}
                    >
                      {item.company.name}
                    </Text>
                    <Text
                      className="mt-0.5 text-xs text-ink-muted dark:text-white/55"
                      style={{ fontFamily: getFontFamily('regular') }}
                    >
                      {new Date(item.createdAt).toLocaleDateString(i18n.language, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                    <View className="mt-2">
                      <AdminStatusBadge
                        label={t(`admin.projects.status.${item.status}`)}
                        tone={projectTone(item.status)}
                      />
                    </View>
                  </View>
                </View>
              </Pressable>

              {expanded ? (
                <View className="px-3 pb-3">
                  <AdminProjectsDetailCard
                    project={item}
                    acting={actingId === item.id}
                    onApprove={() =>
                      void runAction(
                        item.id,
                        () => adminApi.approveProject(item.id),
                        'admin.projects.approved',
                      )
                    }
                    onReject={() =>
                      void runAction(
                        item.id,
                        () => adminApi.rejectProject(item.id),
                        'admin.projects.rejected',
                      )
                    }
                    onDelete={() => confirmDelete(item.id)}
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
