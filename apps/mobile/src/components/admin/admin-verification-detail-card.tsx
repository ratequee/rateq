import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DocumentFullscreenViewer } from '@/components/ui/document-fullscreen-viewer';
import { ImageFullscreenViewer } from '@/components/ui/image-fullscreen-viewer';
import { AdminStatusBadge } from '@/components/admin/admin-filter-chips';
import { getFontFamily } from '@/i18n';
import type {
  AdminCompanyVerificationDetail,
  AdminProfileChangeField,
  CompanyCatalogLabel,
  CompanyCategoryLabel,
} from '@rateq/types';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View } from 'react-native';

const DOC_FIELDS = new Set(['registrationDocUrl', 'establishmentCardUrl', 'tradeLicenseUrl']);

function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|gif|webp|heic|bmp)(\?|$)/i.test(url) || url.includes('image%2F');
}

function statusTone(status: string): 'pending' | 'success' | 'danger' | 'neutral' {
  if (status === 'pending') return 'pending';
  if (status === 'revision_requested') return 'pending';
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  return 'neutral';
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-0.5">
      <Text
        className="text-[10px] uppercase text-ink-muted dark:text-white/55"
        style={{ fontFamily: getFontFamily('semibold'), letterSpacing: 0.4, lineHeight: 14 }}
      >
        {label}
      </Text>
      <Text
        className="text-sm text-ink dark:text-white"
        style={{ fontFamily: getFontFamily('medium'), lineHeight: 20 }}
      >
        {value || '—'}
      </Text>
    </View>
  );
}

function ChipGroup({
  title,
  items,
}: {
  title: string;
  items: Array<CompanyCategoryLabel | CompanyCatalogLabel>;
}) {
  const { t } = useTranslation();
  return (
    <View>
      <Text
        className="text-[10px] uppercase text-ink-muted dark:text-white/55"
        style={{ fontFamily: getFontFamily('semibold'), letterSpacing: 0.4, lineHeight: 14 }}
      >
        {title}
      </Text>
      {items.length === 0 ? (
        <Text
          className="mt-1 text-sm text-ink-muted dark:text-white/65"
          style={{ fontFamily: getFontFamily('regular') }}
        >
          {t('admin.verifications.notProvided')}
        </Text>
      ) : (
        <View className="mt-2 flex-row flex-wrap gap-2">
          {items.map((item) => (
            <View
              key={item.id}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 dark:border-dm-border dark:bg-dm-surface"
            >
              <Text
                className="text-xs text-ink dark:text-white"
                style={{ fontFamily: getFontFamily('medium'), lineHeight: 16 }}
              >
                {item.label}
              </Text>
              {item.labelAr && item.labelAr.trim() !== item.label.trim() ? (
                <Text
                  className="text-[10px] text-ink-muted dark:text-white/60"
                  style={{ fontFamily: getFontFamily('regular'), writingDirection: 'rtl' }}
                >
                  {item.labelAr}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function MediaCard({ label, url, image }: { label: string; url: string | null; image?: boolean }) {
  const { t } = useTranslation();
  const [viewerVisible, setViewerVisible] = useState(false);
  const treatAsImage = Boolean(image || (url && isImageUrl(url)));

  if (!url) {
    return (
      <View className="rounded-xl border border-dashed border-slate-200 p-3 dark:border-dm-border">
        <Text
          className="text-xs text-ink-muted dark:text-white/60"
          style={{ fontFamily: getFontFamily('medium') }}
        >
          {label}: {t('admin.verifications.notProvided')}
        </Text>
      </View>
    );
  }

  return (
    <>
      <Pressable
        onPress={() => setViewerVisible(true)}
        className="overflow-hidden rounded-xl border border-slate-200 dark:border-dm-border"
      >
        <View className="border-b border-slate-100 bg-slate-50 px-3 py-2 dark:border-dm-border dark:bg-dm-elevated">
          <Text
            className="text-xs text-ink dark:text-white"
            style={{ fontFamily: getFontFamily('semibold') }}
          >
            {label}
          </Text>
        </View>
        {treatAsImage ? (
          <Image source={{ uri: url }} className="h-28 w-full" resizeMode="cover" />
        ) : (
          <View className="flex-row items-center justify-center gap-2 px-3 py-4">
            <Ionicons name="document-attach-outline" size={18} color="#8E2157" />
            <Text
              className="text-sm text-brand-500"
              style={{ fontFamily: getFontFamily('medium') }}
            >
              {t('admin.verifications.openDocument')}
            </Text>
          </View>
        )}
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
          title={label}
          visible={viewerVisible}
          onClose={() => setViewerVisible(false)}
        />
      )}
    </>
  );
}

function ProfileChangeValue({ field, value }: { field: string; value: string }) {
  const { t } = useTranslation();
  const [viewerVisible, setViewerVisible] = useState(false);
  const isDoc = DOC_FIELDS.has(field) && /^https?:\/\//i.test(value);
  const treatAsImage = isDoc && isImageUrl(value);

  if (isDoc) {
    return (
      <>
        <Pressable onPress={() => setViewerVisible(true)} className="flex-row items-center gap-1">
          <Ionicons name="expand-outline" size={14} color="#8E2157" />
          <Text className="text-sm text-brand-500" style={{ fontFamily: getFontFamily('medium') }}>
            {t('admin.verifications.openDocument')}
          </Text>
        </Pressable>

        {treatAsImage ? (
          <ImageFullscreenViewer
            images={[value]}
            visible={viewerVisible}
            onClose={() => setViewerVisible(false)}
          />
        ) : (
          <DocumentFullscreenViewer
            uri={value}
            title={t('admin.verifications.openDocument')}
            visible={viewerVisible}
            onClose={() => setViewerVisible(false)}
          />
        )}
      </>
    );
  }

  return (
    <Text
      className="text-sm text-ink dark:text-white"
      style={{ fontFamily: getFontFamily('regular'), lineHeight: 18 }}
    >
      {value || '—'}
    </Text>
  );
}

function ProfileChangeDiff({ fields }: { fields: AdminProfileChangeField[] }) {
  const { t } = useTranslation();

  if (fields.length === 0) {
    return (
      <Text
        className="text-sm text-ink-muted dark:text-white/70"
        style={{ fontFamily: getFontFamily('regular') }}
      >
        {t('admin.verifications.profileChangeEmpty')}
      </Text>
    );
  }

  return (
    <View className="gap-3">
      {fields.map((field) => (
        <View
          key={field.field}
          className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-dm-border dark:bg-dm-elevated"
        >
          <Text
            className="text-xs font-semibold text-ink dark:text-white"
            style={{ fontFamily: getFontFamily('semibold') }}
          >
            {field.label}
          </Text>
          <View className="mt-2 gap-2">
            <View>
              <Text
                className="mb-0.5 text-[10px] uppercase text-ink-muted dark:text-white/55"
                style={{ fontFamily: getFontFamily('semibold') }}
              >
                {t('admin.verifications.current')}
              </Text>
              <ProfileChangeValue field={field.field} value={field.current} />
            </View>
            <View>
              <Text
                className="mb-0.5 text-[10px] uppercase text-brand-500"
                style={{ fontFamily: getFontFamily('semibold') }}
              >
                {t('admin.verifications.proposed')}
              </Text>
              <ProfileChangeValue field={field.field} value={field.proposed} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

interface AdminVerificationDetailCardProps {
  detail: AdminCompanyVerificationDetail;
  acting: boolean;
  revisionOpen: boolean;
  revisionNotes: string;
  onRevisionNotesChange: (value: string) => void;
  onOpenRevision: () => void;
  onCloseRevision: () => void;
  onApprove: () => void;
  onReject: () => void;
  onSendRevision: () => void;
  onApproveProfileChanges: () => void;
  onRejectProfileChanges: () => void;
}

export function AdminVerificationDetailCard({
  detail,
  acting,
  revisionOpen,
  revisionNotes,
  onRevisionNotesChange,
  onOpenRevision,
  onCloseRevision,
  onApprove,
  onReject,
  onSendRevision,
  onApproveProfileChanges,
  onRejectProfileChanges,
}: AdminVerificationDetailCardProps) {
  const { t, i18n } = useTranslation();
  const isProfileChanges = detail.profileChangeStatus === 'pending';
  const canDecide = detail.verificationStatus === 'pending' && !isProfileChanges;
  const locale = i18n.language;

  const formatDate = (value: string | null | undefined) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  return (
    <View className="gap-4 border-t border-slate-100 pt-3 dark:border-dm-border">
      <View className="flex-row flex-wrap items-center gap-2">
        <AdminStatusBadge
          label={t(`admin.verificationStatus.${detail.verificationStatus}`)}
          tone={statusTone(detail.verificationStatus)}
        />
        {isProfileChanges ? (
          <View className="rounded-full bg-violet-100 px-2.5 py-0.5 dark:bg-violet-950/50">
            <Text
              className="text-[10px] text-violet-800 dark:text-violet-300"
              style={{ fontFamily: getFontFamily('semibold'), lineHeight: 14 }}
            >
              {t('admin.verifications.profileChangeBadge')}
            </Text>
          </View>
        ) : null}
        <Text
          className="text-xs text-ink-muted dark:text-white/60"
          style={{ fontFamily: getFontFamily('regular') }}
        >
          {t('admin.verifications.metrics', {
            reviews: detail.reviewCount,
            visits: detail.pageVisitCount,
          })}
        </Text>
      </View>

      {isProfileChanges ? (
        <View className="gap-3">
          <View>
            <Text
              className="text-sm font-semibold text-ink dark:text-white"
              style={{ fontFamily: getFontFamily('semibold') }}
            >
              {t('admin.verifications.profileChangeTitle')}
            </Text>
            <Text
              className="mt-1 text-xs text-ink-muted dark:text-white/65"
              style={{ fontFamily: getFontFamily('regular'), lineHeight: 16 }}
            >
              {t('admin.verifications.profileChangeSubtitle')}
            </Text>
          </View>
          <ProfileChangeDiff fields={detail.profileChangeFields ?? []} />
          <View className="flex-row flex-wrap gap-2">
            <Button
              title={t('admin.actions.reject')}
              variant="outline"
              size="md"
              className="min-w-[100px] flex-1"
              disabled={acting}
              onPress={onRejectProfileChanges}
            />
            <Button
              title={t('admin.actions.approve')}
              size="md"
              className="min-w-[100px] flex-1"
              loading={acting}
              onPress={onApproveProfileChanges}
            />
          </View>
        </View>
      ) : (
        <>
          {detail.revisionNotes ? (
            <View className="rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/40">
              <Text
                className="text-xs font-semibold text-blue-900 dark:text-blue-200"
                style={{ fontFamily: getFontFamily('semibold') }}
              >
                {t('admin.verifications.revisionNotesLabel')}
              </Text>
              <Text
                className="mt-1 text-sm text-blue-900 dark:text-blue-100"
                style={{ fontFamily: getFontFamily('regular'), lineHeight: 20 }}
              >
                {detail.revisionNotes}
              </Text>
            </View>
          ) : null}

          {canDecide ? (
            <View className="gap-2">
              <View className="flex-row flex-wrap gap-2">
                <Button
                  title={t('admin.actions.reject')}
                  variant="outline"
                  size="md"
                  className="min-w-[90px] flex-1"
                  disabled={acting || revisionOpen}
                  onPress={onReject}
                />
                <Button
                  title={t('admin.verifications.sendForReview')}
                  variant="ghost"
                  size="md"
                  className="min-w-[90px] flex-1"
                  disabled={acting}
                  onPress={onOpenRevision}
                />
                <Button
                  title={t('admin.actions.approve')}
                  size="md"
                  className="min-w-[90px] flex-1"
                  loading={acting}
                  disabled={revisionOpen}
                  onPress={onApprove}
                />
              </View>

              {revisionOpen ? (
                <View className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-dm-border dark:bg-dm-elevated">
                  <Text
                    className="mb-2 text-xs font-semibold text-ink dark:text-white"
                    style={{ fontFamily: getFontFamily('semibold') }}
                  >
                    {t('admin.verifications.revisionModalLabel')}
                  </Text>
                  <Input
                    multiline
                    value={revisionNotes}
                    onChangeText={onRevisionNotesChange}
                    placeholder={t('admin.verifications.revisionModalPlaceholder')}
                    className="min-h-[96px] bg-white dark:bg-dm-surface"
                  />
                  <View className="mt-2 flex-row gap-2">
                    <Button
                      title={t('common.cancel')}
                      variant="outline"
                      size="md"
                      className="flex-1"
                      disabled={acting}
                      onPress={onCloseRevision}
                    />
                    <Button
                      title={t('admin.verifications.sendRevision')}
                      size="md"
                      className="flex-1"
                      loading={acting}
                      onPress={onSendRevision}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}

          {detail.description ? (
            <View>
              <Text
                className="text-[10px] uppercase text-ink-muted dark:text-white/55"
                style={{ fontFamily: getFontFamily('semibold'), letterSpacing: 0.4 }}
              >
                {t('admin.verifications.description')}
              </Text>
              <Text
                className="mt-1 text-sm text-ink dark:text-white"
                style={{ fontFamily: getFontFamily('regular'), lineHeight: 20 }}
              >
                {detail.description}
              </Text>
            </View>
          ) : null}

          <View className="gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-dm-border dark:bg-dm-elevated">
            <DetailRow
              label={t('admin.verifications.ownerEmail')}
              value={detail.owner?.email ?? t('admin.verifications.unknownOwner')}
            />
            <DetailRow label={t('admin.verifications.crNumber')} value={detail.crNumber ?? '—'} />
            <DetailRow label={t('admin.verifications.address')} value={detail.address ?? '—'} />
            <DetailRow
              label={t('admin.verifications.validationDate')}
              value={formatDate(detail.validationDate)}
            />
            <DetailRow
              label={t('admin.verifications.submittedAt')}
              value={formatDateTime(detail.createdAt)}
            />
            <DetailRow
              label={t('admin.verifications.updatedAt')}
              value={formatDateTime(detail.updatedAt)}
            />
          </View>

          <View className="gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-dm-border dark:bg-dm-elevated">
            <Text
              className="text-sm font-semibold text-ink dark:text-white"
              style={{ fontFamily: getFontFamily('semibold') }}
            >
              {t('admin.verifications.profileSelections')}
            </Text>
            <ChipGroup
              title={t('admin.verifications.categories')}
              items={detail.categoryItems ?? []}
            />
            <ChipGroup
              title={t('admin.verifications.services')}
              items={detail.serviceItems ?? []}
            />
            <ChipGroup
              title={t('admin.verifications.activities')}
              items={detail.activityItems ?? []}
            />
          </View>

          <View className="gap-2">
            <Text
              className="text-sm font-semibold text-ink dark:text-white"
              style={{ fontFamily: getFontFamily('semibold') }}
            >
              {t('admin.verifications.documents')}
            </Text>
            <MediaCard
              label={t('admin.verifications.establishmentCard')}
              url={detail.establishmentCardUrl}
            />
            <MediaCard label={t('admin.verifications.tradeLicense')} url={detail.tradeLicenseUrl} />
            <MediaCard
              label={t('admin.verifications.registrationDoc')}
              url={detail.registrationDocUrl}
            />
            <MediaCard label={t('admin.verifications.logo')} url={detail.logo} image />
            <MediaCard label={t('admin.verifications.cover')} url={detail.coverUrl} image />
          </View>
        </>
      )}
    </View>
  );
}
