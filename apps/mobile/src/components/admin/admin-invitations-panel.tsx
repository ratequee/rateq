import { AdminActionButtons } from '@/components/admin/admin-action-buttons';
import { AdminStatusBadge } from '@/components/admin/admin-filter-chips';
import { DocumentFullscreenViewer } from '@/components/ui/document-fullscreen-viewer';
import { ImageFullscreenViewer } from '@/components/ui/image-fullscreen-viewer';
import { LoadingView } from '@/components/ui/loading-view';
import { useAppToast } from '@/hooks/use-app-toast';
import { getFontFamily } from '@/i18n';
import { adminApi } from '@/lib/admin-api';
import type { ReviewerInvitationRequestPublic } from '@rateq/types';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|gif|webp|heic|bmp)(\?|$)/i.test(url) || url.includes('image%2F');
}

function InvitationProofRow({ url, index }: { url: string; index: number }) {
  const { t } = useTranslation();
  const [viewerVisible, setViewerVisible] = useState(false);
  const treatAsImage = isImageUrl(url);
  const title = t('admin.invitations.proof', { index });

  return (
    <>
      <Pressable
        onPress={() => setViewerVisible(true)}
        className="flex-row items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-dm-border dark:bg-dm-elevated"
      >
        <Ionicons
          name={treatAsImage ? 'image-outline' : 'document-attach-outline'}
          size={16}
          color="#8E2157"
        />
        <Text
          className="flex-1 text-sm text-brand-500"
          style={{ fontFamily: getFontFamily('medium') }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Ionicons name="expand-outline" size={16} color="#64748b" />
      </Pressable>

      {treatAsImage ? (
        <ImageFullscreenViewer
          images={[url]}
          visible={viewerVisible}
          onClose={() => setViewerVisible(false)}
        />
      ) : (
        <DocumentFullscreenViewer
          uri={url}
          title={title}
          visible={viewerVisible}
          onClose={() => setViewerVisible(false)}
        />
      )}
    </>
  );
}

export function AdminInvitationsPanel() {
  const { t } = useTranslation();
  const toast = useAppToast();
  const [items, setItems] = useState<ReviewerInvitationRequestPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await adminApi.listReviewerInvitationRequests();
      setItems(result);
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
      <View className="border-b border-slate-100 px-4 py-2 dark:border-dm-border">
        <Text
          className="text-xs text-ink-muted dark:text-white/65"
          style={{ fontFamily: getFontFamily('medium'), lineHeight: 16 }}
        >
          {t('admin.invitations.pendingCount', { count: items.length })}
        </Text>
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
        renderItem={({ item }) => (
          <View className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-dm-border dark:bg-dm-surface">
            <View className="flex-row items-start justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text
                  className="text-base font-semibold text-ink dark:text-white"
                  style={{ fontFamily: getFontFamily('semibold') }}
                >
                  {item.reviewerName}
                </Text>
                <Text
                  className="mt-1 text-xs text-ink-muted dark:text-white/65"
                  style={{ fontFamily: getFontFamily('regular') }}
                >
                  {item.email}
                </Text>
                <Text
                  className="mt-1 text-xs text-ink-muted dark:text-white/65"
                  style={{ fontFamily: getFontFamily('regular') }}
                >
                  {item.companyName ?? '—'} · {item.serviceProvided}
                </Text>
              </View>
              <AdminStatusBadge label={item.status} tone="pending" />
            </View>

            {item.proofUrls.length > 0 ? (
              <View className="mt-3 gap-2">
                {item.proofUrls.map((url, index) => (
                  <InvitationProofRow key={`${url}-${index}`} url={url} index={index + 1} />
                ))}
              </View>
            ) : null}

            <AdminActionButtons
              acting={actingId === item.id}
              approveLabel={t('admin.actions.approve')}
              rejectLabel={t('admin.actions.reject')}
              deleteLabel={t('admin.actions.delete')}
              onApprove={() =>
                void runAction(
                  item.id,
                  () => adminApi.approveReviewerInvitationRequest(item.id),
                  'admin.invitations.approved',
                )
              }
              onReject={() =>
                void runAction(
                  item.id,
                  () => adminApi.rejectReviewerInvitationRequest(item.id),
                  'admin.invitations.rejected',
                )
              }
              onDelete={() =>
                Alert.alert(t('admin.invitations.deleteTitle'), t('admin.invitations.deleteBody'), [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('admin.actions.delete'),
                    style: 'destructive',
                    onPress: () =>
                      void runAction(
                        item.id,
                        () => adminApi.deleteReviewerInvitationRequest(item.id),
                        'admin.invitations.deleted',
                      ),
                  },
                ])
              }
            />
          </View>
        )}
      />
    </View>
  );
}
