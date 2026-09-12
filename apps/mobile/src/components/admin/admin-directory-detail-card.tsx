import { AdminStatusBadge } from '@/components/admin/admin-filter-chips';
import { Button } from '@/components/ui/button';
import { DocumentFullscreenViewer } from '@/components/ui/document-fullscreen-viewer';
import { ImageFullscreenViewer } from '@/components/ui/image-fullscreen-viewer';
import { getFontFamily } from '@/i18n';
import type { AdminCompanyDetail, AdminUserDetail, ReviewPublic } from '@rateq/types';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Linking, Pressable, Text, View } from 'react-native';

function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|gif|webp|heic|bmp)(\?|$)/i.test(url) || url.includes('image%2F');
}

function verificationTone(status: string): 'pending' | 'success' | 'danger' | 'neutral' {
  if (status === 'pending' || status === 'revision_requested') return 'pending';
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  return 'neutral';
}

function reviewTone(status: string): 'pending' | 'success' | 'danger' | 'neutral' {
  if (status === 'PENDING' || status === 'MODIFIED' || status === 'RESOLUTION_PENDING') {
    return 'pending';
  }
  if (status === 'APPROVED' || status === 'PROCEEDED') return 'success';
  if (status === 'REJECTED' || status === 'DELETED') return 'danger';
  return 'neutral';
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-0.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-dm-border dark:bg-dm-elevated">
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

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      className="mb-2 text-sm font-semibold text-ink dark:text-white"
      style={{ fontFamily: getFontFamily('semibold') }}
    >
      {children}
    </Text>
  );
}

function MediaCard({
  label,
  url,
  image,
}: {
  label: string;
  url: string | null | undefined;
  image?: boolean;
}) {
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

function EntityReviewsList({
  reviews,
  acting,
  canModerate,
  onDeleteReview,
  onDeleteReply,
}: {
  reviews: ReviewPublic[];
  acting: boolean;
  canModerate: boolean;
  onDeleteReview: (reviewId: string) => void;
  onDeleteReply: (reviewId: string) => void;
}) {
  const { t, i18n } = useTranslation();

  if (!reviews.length) {
    return (
      <Text
        className="text-sm text-ink-muted dark:text-white/70"
        style={{ fontFamily: getFontFamily('regular') }}
      >
        {t('admin.directory.noReviews')}
      </Text>
    );
  }

  return (
    <View className="gap-3">
      {reviews.map((review) => (
        <View
          key={review.id}
          className="rounded-xl border border-slate-200 p-3 dark:border-dm-border"
        >
          <View className="flex-row items-start justify-between gap-2">
            <View className="min-w-0 flex-1">
              <Text
                className="text-sm font-semibold text-ink dark:text-white"
                style={{ fontFamily: getFontFamily('semibold') }}
                numberOfLines={2}
              >
                {review.title}
              </Text>
              <Text
                className="mt-1 text-xs text-ink-muted dark:text-white/65"
                style={{ fontFamily: getFontFamily('regular') }}
              >
                {review.company?.name ?? t('admin.directory.unknownCompany')} ·{' '}
                {review.author?.displayName ?? t('admin.directory.unknownReviewer')}
              </Text>
            </View>
            <AdminStatusBadge label={review.status} tone={reviewTone(review.status)} />
          </View>
          <Text
            className="mt-2 text-xs text-ink-muted dark:text-white/65"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            ★ {review.rating} ·{' '}
            {new Date(review.createdAt).toLocaleDateString(i18n.language, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
          <Text
            className="mt-2 text-sm text-ink-muted dark:text-white/75"
            style={{ fontFamily: getFontFamily('regular'), lineHeight: 20 }}
            numberOfLines={3}
          >
            {review.content}
          </Text>

          {review.reply ? (
            <View className="mt-3 rounded-lg border border-brand-100 bg-brand-50/60 p-3 dark:border-brand-900/50 dark:bg-brand-950/30">
              <View className="mb-1 flex-row flex-wrap items-center justify-between gap-2">
                <View className="flex-row flex-wrap items-center gap-2">
                  <Text
                    className="text-xs font-semibold text-brand-700 dark:text-brand-300"
                    style={{ fontFamily: getFontFamily('semibold') }}
                  >
                    {t('company.companyReply')}
                  </Text>
                  <AdminStatusBadge
                    label={review.reply.status}
                    tone={reviewTone(review.reply.status)}
                  />
                </View>
                {canModerate ? (
                  <Button
                    title={t('admin.directory.deleteReply')}
                    variant="outline"
                    size="md"
                    disabled={acting}
                    onPress={() => onDeleteReply(review.id)}
                  />
                ) : null}
              </View>
              <Text
                className="text-sm text-ink dark:text-white/85"
                style={{ fontFamily: getFontFamily('regular'), lineHeight: 20 }}
              >
                {review.reply.content}
              </Text>
            </View>
          ) : null}

          {canModerate ? (
            <Button
              title={t('admin.actions.delete')}
              variant="ghost"
              size="md"
              className="mt-3"
              disabled={acting}
              onPress={() => onDeleteReview(review.id)}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

interface SharedDetailActions {
  acting: boolean;
  canModerateReviews: boolean;
  onDeleteReview: (reviewId: string) => void;
  onDeleteReply: (reviewId: string) => void;
}

interface AdminDirectoryCompanyDetailProps extends SharedDetailActions {
  detail: AdminCompanyDetail;
  onToggleStamp: () => void;
  onToggleTrusted: () => void;
  onDeleteCompany: () => void;
  onToggleOwnerActive?: () => void;
  onDeleteOwner?: () => void;
}

export function AdminDirectoryCompanyDetail({
  detail,
  acting,
  canModerateReviews,
  onToggleStamp,
  onToggleTrusted,
  onDeleteCompany,
  onToggleOwnerActive,
  onDeleteOwner,
  onDeleteReview,
  onDeleteReply,
}: AdminDirectoryCompanyDetailProps) {
  const { t, i18n } = useTranslation();
  const statusKey = `admin.verificationStatus.${detail.verificationStatus}`;
  const statusLabel = t(statusKey, { defaultValue: detail.verificationStatus });

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  const contactItems: Array<{ label: string; value: string }> = [
    { label: t('admin.directory.registeredAt'), value: formatDateTime(detail.createdAt) },
  ];
  if (detail.phone) contactItems.push({ label: t('onboarding.phone'), value: detail.phone });
  if (detail.address) {
    contactItems.push({ label: t('admin.verifications.address'), value: detail.address });
  }
  if (detail.crNumber) {
    contactItems.push({ label: t('admin.verifications.crNumber'), value: detail.crNumber });
  }
  if (detail.validationDate) {
    contactItems.push({
      label: t('admin.verifications.validationDate'),
      value: new Date(detail.validationDate).toLocaleDateString(i18n.language),
    });
  }

  return (
    <View className="gap-4 border-t border-slate-100 pt-3 dark:border-dm-border">
      <View className="flex-row flex-wrap items-center gap-2">
        <AdminStatusBadge label={statusLabel} tone={verificationTone(detail.verificationStatus)} />
        {detail.showVerifiedStamp ? (
          <AdminStatusBadge label={t('admin.directory.stampOn')} tone="success" />
        ) : null}
        {detail.isTrusted ? (
          <AdminStatusBadge label={t('admin.directory.trustedOn')} tone="pending" />
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

      {detail.ownerEmail ? (
        <View className="flex-row flex-wrap items-center gap-2">
          <Text
            className="text-sm text-ink-muted dark:text-white/70"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {t('admin.directory.ownerEmail', { email: detail.ownerEmail })}
          </Text>
          <AdminStatusBadge
            label={
              detail.ownerIsActive === false
                ? t('admin.directory.inactive')
                : t('admin.directory.active')
            }
            tone={detail.ownerIsActive === false ? 'danger' : 'success'}
          />
        </View>
      ) : (
        <Text
          className="text-sm text-amber-700 dark:text-amber-300"
          style={{ fontFamily: getFontFamily('medium') }}
        >
          {t('admin.directory.noOwnerAccount')}
        </Text>
      )}

      <View>
        <SectionTitle>{t('admin.directory.companyActions')}</SectionTitle>
        <View className="flex-row flex-wrap gap-2">
          <Button
            title={
              detail.showVerifiedStamp
                ? t('admin.directory.removeStamp')
                : t('admin.directory.addStamp')
            }
            variant="outline"
            size="md"
            className="min-w-[140px] flex-1"
            disabled={acting}
            onPress={onToggleStamp}
          />
          <Button
            title={detail.isTrusted ? t('admin.directory.untrust') : t('admin.directory.trust')}
            variant="outline"
            size="md"
            className="min-w-[140px] flex-1"
            disabled={acting}
            onPress={onToggleTrusted}
          />
          <Button
            title={t('admin.directory.deleteCompany')}
            variant="ghost"
            size="md"
            className="min-w-[140px] flex-1"
            disabled={acting}
            onPress={onDeleteCompany}
          />
        </View>
      </View>

      {detail.ownerId && onToggleOwnerActive && onDeleteOwner ? (
        <View>
          <SectionTitle>{t('admin.directory.ownerAccountActions')}</SectionTitle>
          <View className="flex-row flex-wrap gap-2">
            <Button
              title={
                detail.ownerIsActive === false
                  ? t('admin.directory.activateOwner')
                  : t('admin.directory.deactivateOwner')
              }
              variant="outline"
              size="md"
              className="min-w-[140px] flex-1"
              disabled={acting}
              onPress={onToggleOwnerActive}
            />
            <Button
              title={t('admin.directory.deleteOwner')}
              variant="ghost"
              size="md"
              className="min-w-[140px] flex-1"
              disabled={acting}
              onPress={onDeleteOwner}
            />
          </View>
        </View>
      ) : null}

      {contactItems.length > 0 ? (
        <View>
          <SectionTitle>{t('admin.directory.contactDetails')}</SectionTitle>
          <View className="gap-2">
            {contactItems.map((item) => (
              <DetailRow key={item.label} label={item.label} value={item.value} />
            ))}
          </View>
        </View>
      ) : null}

      <View>
        <SectionTitle>{t('admin.verifications.documents')}</SectionTitle>
        <View className="gap-2">
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
      </View>

      <View>
        <SectionTitle>{t('admin.directory.reviewsAndReplies')}</SectionTitle>
        <EntityReviewsList
          reviews={detail.reviews}
          acting={acting}
          canModerate={canModerateReviews}
          onDeleteReview={onDeleteReview}
          onDeleteReply={onDeleteReply}
        />
      </View>
    </View>
  );
}

interface AdminDirectoryReviewerDetailProps extends SharedDetailActions {
  detail: AdminUserDetail;
  onToggleActive: () => void;
  onDeleteAccount: () => void;
}

export function AdminDirectoryReviewerDetail({
  detail,
  acting,
  canModerateReviews,
  onToggleActive,
  onDeleteAccount,
  onDeleteReview,
  onDeleteReply,
}: AdminDirectoryReviewerDetailProps) {
  const { t } = useTranslation();
  const displayName = detail.fullName ?? detail.displayName ?? detail.email;
  const location = [detail.city, detail.country].filter(Boolean).join(', ');

  return (
    <View className="gap-4 border-t border-slate-100 pt-3 dark:border-dm-border">
      <View className="flex-row flex-wrap items-center gap-2">
        <AdminStatusBadge
          label={detail.isActive ? t('admin.directory.active') : t('admin.directory.inactive')}
          tone={detail.isActive ? 'success' : 'danger'}
        />
        <AdminStatusBadge
          label={
            detail.isProfileComplete
              ? t('admin.directory.profileComplete')
              : t('admin.directory.profileIncomplete')
          }
          tone={detail.isProfileComplete ? 'success' : 'pending'}
        />
      </View>

      <View className="gap-2">
        <DetailRow label={t('admin.verifications.ownerEmail')} value={detail.email} />
        {detail.phone ? (
          <Pressable
            onPress={() => void Linking.openURL(`tel:${detail.phone!.replace(/[^\d+]/g, '')}`)}
          >
            <DetailRow label={t('onboarding.phone')} value={detail.phone} />
          </Pressable>
        ) : null}
        {location ? <DetailRow label={t('admin.directory.location')} value={location} /> : null}
        <DetailRow
          label={t('admin.directory.profileStatus')}
          value={
            detail.isProfileComplete
              ? t('admin.directory.profileComplete')
              : t('admin.directory.profileIncomplete')
          }
        />
      </View>

      <View className="flex-row flex-wrap gap-2">
        <Button
          title={detail.isActive ? t('admin.directory.deactivate') : t('admin.directory.activate')}
          variant="outline"
          size="md"
          className="min-w-[140px] flex-1"
          disabled={acting}
          onPress={onToggleActive}
        />
        <Button
          title={t('admin.directory.deleteAccount')}
          variant="ghost"
          size="md"
          className="min-w-[140px] flex-1"
          disabled={acting}
          onPress={onDeleteAccount}
        />
      </View>

      <View>
        <SectionTitle>{t('admin.directory.reviewsAndReplies')}</SectionTitle>
        <Text
          className="mb-2 text-xs text-ink-muted dark:text-white/60"
          style={{ fontFamily: getFontFamily('regular') }}
        >
          {displayName} · {t('admin.directory.reviewsCount', { count: detail.reviewCount })}
        </Text>
        <EntityReviewsList
          reviews={detail.reviews}
          acting={acting}
          canModerate={canModerateReviews}
          onDeleteReview={onDeleteReview}
          onDeleteReply={onDeleteReply}
        />
      </View>
    </View>
  );
}
