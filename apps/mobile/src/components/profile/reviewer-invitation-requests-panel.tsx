import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProfileFormSection } from '@/components/profile/profile-form-section';
import { DocumentFullscreenViewer } from '@/components/ui/document-fullscreen-viewer';
import { ImageFullscreenViewer } from '@/components/ui/image-fullscreen-viewer';
import { useAppToast } from '@/hooks/use-app-toast';
import { getFontFamily } from '@/i18n';
import { onboardingApi } from '@/lib/api';
import {
  MAX_INVITATION_PROOF_FILES,
  uploadInvitationProofFiles,
} from '@/lib/invitation-proof-upload';
import {
  createReviewProofFile,
  isReviewProofFileWithinLimit,
  type ReviewProofFile,
} from '@/lib/review-proof-upload';
import { cn } from '@/lib/cn';
import type { ReviewerInvitationRequestPublic } from '@rateq/types';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Linking, Pressable, Text, View } from 'react-native';

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  rejected: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400',
};

function isImageProof(url: string): boolean {
  return /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url) || url.includes('image%2F');
}

function ProofFileRow({
  name,
  onRemove,
  onPress,
}: {
  name: string;
  onRemove?: () => void;
  onPress?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-dm-border dark:bg-dm-elevated">
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        className="min-w-0 flex-1 flex-row items-center gap-2"
      >
        <Ionicons name="document-attach-outline" size={18} color="#8E2157" />
        <Text
          className="min-w-0 flex-1 text-sm text-ink dark:text-white"
          style={{ fontFamily: getFontFamily('medium') }}
          numberOfLines={2}
        >
          {name}
        </Text>
        {onPress ? <Ionicons name="expand-outline" size={16} color="#64748b" /> : null}
      </Pressable>
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={t('reviewerInvitations.removeProof')}
          className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10"
          hitSlop={8}
        >
          <Ionicons name="close" size={16} color="#64748b" />
        </Pressable>
      ) : null}
    </View>
  );
}

function useProofPicker() {
  const { t } = useTranslation();
  const toast = useAppToast();

  const pickProof = (onPick: (file: ReviewProofFile) => void, currentCount: number) => {
    if (currentCount >= MAX_INVITATION_PROOF_FILES) {
      toast.error(t('review.proofMaxFiles', { count: MAX_INVITATION_PROOF_FILES }));
      return;
    }

    Alert.alert(t('reviewerInvitations.addProof'), undefined, [
      {
        text: t('review.proofPickImage'),
        onPress: () => void pickImage(onPick),
      },
      {
        text: t('review.proofPickDocument'),
        onPress: () => void pickDocument(onPick),
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const pickImage = async (onPick: (file: ReviewProofFile) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const file = await createReviewProofFile({
      uri: asset.uri,
      name: asset.fileName ?? 'proof.jpg',
      mimeType: asset.mimeType ?? 'image/jpeg',
      reportedSize: asset.fileSize,
    });
    if (!isReviewProofFileWithinLimit(file.size)) {
      toast.error(t('review.proofFileTooLarge'));
      return;
    }
    onPick(file);
  };

  const pickDocument = async (onPick: (file: ReviewProofFile) => void) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const file = await createReviewProofFile({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? 'application/pdf',
      reportedSize: asset.size,
    });
    if (!isReviewProofFileWithinLimit(file.size)) {
      toast.error(t('review.proofFileTooLarge'));
      return;
    }
    onPick(file);
  };

  return { pickProof };
}

interface ReviewerInvitationRequestsPanelProps {
  refreshToken?: number;
  onRefreshEnd?: () => void;
}

export function ReviewerInvitationRequestsPanel({
  refreshToken = 0,
  onRefreshEnd,
}: ReviewerInvitationRequestsPanelProps) {
  const { t } = useTranslation();
  const toast = useAppToast();
  const { pickProof } = useProofPicker();

  const [requests, setRequests] = useState<ReviewerInvitationRequestPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewerName, setReviewerName] = useState('');
  const [email, setEmail] = useState('');
  const [serviceProvided, setServiceProvided] = useState('');
  const [proofFiles, setProofFiles] = useState<ReviewProofFile[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editReviewerName, setEditReviewerName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editServiceProvided, setEditServiceProvided] = useState('');
  const [keptProofUrls, setKeptProofUrls] = useState<string[]>([]);
  const [editProofFiles, setEditProofFiles] = useState<ReviewProofFile[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<{ uri: string; title: string } | null>(
    null,
  );
  const onRefreshEndRef = useRef(onRefreshEnd);
  onRefreshEndRef.current = onRefreshEnd;

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setRequests(await onboardingApi.listReviewerInvitationRequests());
    } catch (err) {
      toast.apiError(err, t('reviewerInvitations.loadError'));
      setRequests([]);
    } finally {
      setLoading(false);
      onRefreshEndRef.current?.();
    }
  }, [t, toast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (refreshToken > 0) {
      void reload();
    }
  }, [refreshToken, reload]);

  const resetEditState = () => {
    setEditingId(null);
    setEditReviewerName('');
    setEditEmail('');
    setEditServiceProvided('');
    setKeptProofUrls([]);
    setEditProofFiles([]);
  };

  const openProofUrl = (url: string, title: string) => {
    if (isImageProof(url)) {
      setPreviewImage(url);
      return;
    }

    void Linking.openURL(url).catch(() => {
      setPreviewDocument({ uri: url, title });
    });
  };

  const submit = async () => {
    if (!reviewerName.trim() || !email.trim() || !serviceProvided.trim()) {
      toast.error(t('reviewerInvitations.fieldsRequired'));
      return;
    }

    if (proofFiles.length === 0) {
      toast.error(t('reviewerInvitations.proofRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const proofUrls = await uploadInvitationProofFiles(proofFiles);
      await onboardingApi.createReviewerInvitationRequest({
        reviewerName: reviewerName.trim(),
        email: email.trim(),
        serviceProvided: serviceProvided.trim(),
        proofUrls,
      });
      setReviewerName('');
      setEmail('');
      setServiceProvided('');
      setProofFiles([]);
      toast.success(t('reviewerInvitations.submitted'));
      await reload();
    } catch (err) {
      toast.apiError(err, t('reviewerInvitations.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (request: ReviewerInvitationRequestPublic) => {
    setEditingId(request.id);
    setEditReviewerName(request.reviewerName);
    setEditEmail(request.email);
    setEditServiceProvided(request.serviceProvided);
    setKeptProofUrls([...request.proofUrls]);
    setEditProofFiles([]);
  };

  const saveEdit = async (requestId: string) => {
    if (!editReviewerName.trim() || !editEmail.trim() || !editServiceProvided.trim()) {
      toast.error(t('reviewerInvitations.fieldsRequired'));
      return;
    }

    if (keptProofUrls.length + editProofFiles.length === 0) {
      toast.error(t('reviewerInvitations.proofRequired'));
      return;
    }

    setSavingId(requestId);
    try {
      const newProofUrls =
        editProofFiles.length > 0 ? await uploadInvitationProofFiles(editProofFiles) : [];
      await onboardingApi.updateReviewerInvitationRequest(requestId, {
        reviewerName: editReviewerName.trim(),
        email: editEmail.trim(),
        serviceProvided: editServiceProvided.trim(),
        proofUrls: [...keptProofUrls, ...newProofUrls],
      });
      toast.success(t('reviewerInvitations.updated'));
      resetEditState();
      await reload();
    } catch (err) {
      toast.apiError(err, t('reviewerInvitations.updateError'));
    } finally {
      setSavingId(null);
    }
  };

  const deleteRequest = (requestId: string) => {
    Alert.alert(t('reviewerInvitations.delete'), t('reviewerInvitations.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('reviewerInvitations.delete'),
        style: 'destructive',
        onPress: () => void confirmDelete(requestId),
      },
    ]);
  };

  const confirmDelete = async (requestId: string) => {
    setDeletingId(requestId);
    try {
      await onboardingApi.deleteReviewerInvitationRequest(requestId);
      if (editingId === requestId) resetEditState();
      toast.success(t('reviewerInvitations.deleted'));
      await reload();
    } catch (err) {
      toast.apiError(err, t('reviewerInvitations.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <ProfileFormSection
        title={t('reviewerInvitations.title')}
        subtitle={t('reviewerInvitations.subtitle')}
      >
        <Input
          value={reviewerName}
          onChangeText={setReviewerName}
          placeholder={t('reviewerInvitations.reviewerNamePlaceholder')}
        />
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder={t('reviewerInvitations.emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          value={serviceProvided}
          onChangeText={setServiceProvided}
          placeholder={t('reviewerInvitations.servicePlaceholder')}
          multiline
          maxLength={2000}
        />

        <View className="gap-2">
          <Button
            title={t('reviewerInvitations.addProof')}
            variant="outline"
            onPress={() =>
              pickProof((file) => setProofFiles((current) => [...current, file]), proofFiles.length)
            }
            disabled={proofFiles.length >= MAX_INVITATION_PROOF_FILES}
          />
          <Text
            className="text-xs text-ink-muted dark:text-white/60"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {t('reviewerInvitations.proofHint')}
          </Text>
          {proofFiles.length > 0 ? (
            <View className="gap-2">
              {proofFiles.map((file, index) => (
                <ProofFileRow
                  key={`${file.uri}-${index}`}
                  name={file.name}
                  onPress={
                    file.mimeType.startsWith('image/')
                      ? () => setPreviewImage(file.uri)
                      : () => setPreviewDocument({ uri: file.uri, title: file.name })
                  }
                  onRemove={() =>
                    setProofFiles((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                />
              ))}
            </View>
          ) : null}
        </View>

        <Button
          title={submitting ? t('onboarding.saving') : t('reviewerInvitations.submit')}
          onPress={() => void submit()}
          loading={submitting}
        />
      </ProfileFormSection>

      <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-dm-border dark:bg-dm-surface">
        <Text
          className="text-base font-semibold text-ink dark:text-white"
          style={{ fontFamily: getFontFamily('semibold') }}
        >
          {t('reviewerInvitations.recentRequests')}
        </Text>

        {loading ? (
          <View className="items-center py-8">
            <ActivityIndicator color="#8E2157" />
          </View>
        ) : requests.length === 0 ? (
          <Text
            className="mt-3 text-sm text-ink-muted dark:text-white/70"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {t('reviewerInvitations.empty')}
          </Text>
        ) : (
          <View className="mt-3 gap-3">
            {requests.map((request) => {
              const isEditing = editingId === request.id;
              const isPending = request.status === 'pending';

              return (
                <View
                  key={request.id}
                  className="rounded-xl border border-slate-200 p-3 dark:border-dm-border"
                >
                  {isEditing ? (
                    <View className="gap-3">
                      <Input
                        value={editReviewerName}
                        onChangeText={setEditReviewerName}
                        placeholder={t('reviewerInvitations.reviewerNamePlaceholder')}
                      />
                      <Input
                        value={editEmail}
                        onChangeText={setEditEmail}
                        placeholder={t('reviewerInvitations.emailPlaceholder')}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                      <Input
                        value={editServiceProvided}
                        onChangeText={setEditServiceProvided}
                        placeholder={t('reviewerInvitations.servicePlaceholder')}
                        multiline
                        maxLength={2000}
                      />

                      {keptProofUrls.length > 0 ? (
                        <View className="gap-2">
                          <Text
                            className="text-xs font-medium text-ink-muted dark:text-white/60"
                            style={{ fontFamily: getFontFamily('medium') }}
                          >
                            {t('reviewerInvitations.existingProof')}
                          </Text>
                          {keptProofUrls.map((url, index) => (
                            <ProofFileRow
                              key={url}
                              name={`${t('reviewerInvitations.viewProof')} ${index + 1}`}
                              onPress={() => openProofUrl(url, `proof-${index + 1}`)}
                              onRemove={() =>
                                setKeptProofUrls((current) =>
                                  current.filter((item) => item !== url),
                                )
                              }
                            />
                          ))}
                        </View>
                      ) : null}

                      <Button
                        title={t('reviewerInvitations.addProof')}
                        variant="outline"
                        onPress={() =>
                          pickProof(
                            (file) => setEditProofFiles((current) => [...current, file]),
                            keptProofUrls.length + editProofFiles.length,
                          )
                        }
                        disabled={
                          keptProofUrls.length + editProofFiles.length >= MAX_INVITATION_PROOF_FILES
                        }
                      />
                      {editProofFiles.length > 0 ? (
                        <View className="gap-2">
                          {editProofFiles.map((file, index) => (
                            <ProofFileRow
                              key={`${file.uri}-${index}`}
                              name={file.name}
                              onRemove={() =>
                                setEditProofFiles((current) =>
                                  current.filter((_, itemIndex) => itemIndex !== index),
                                )
                              }
                            />
                          ))}
                        </View>
                      ) : null}

                      <View className="flex-row flex-wrap gap-2">
                        <Button
                          title={
                            savingId === request.id
                              ? t('onboarding.saving')
                              : t('reviewerInvitations.save')
                          }
                          onPress={() => void saveEdit(request.id)}
                          loading={savingId === request.id}
                        />
                        <Button
                          title={t('reviewerInvitations.cancel')}
                          variant="outline"
                          onPress={resetEditState}
                        />
                      </View>
                    </View>
                  ) : (
                    <>
                      <View className="flex-row items-start justify-between gap-2">
                        <View className="min-w-0 flex-1">
                          <Text
                            className="text-base font-semibold text-ink dark:text-white"
                            style={{ fontFamily: getFontFamily('semibold') }}
                          >
                            {request.reviewerName}
                          </Text>
                          <Text
                            className="text-sm text-ink-muted dark:text-white/70"
                            style={{ fontFamily: getFontFamily('regular') }}
                          >
                            {request.email}
                          </Text>
                          <Text
                            className="mt-1 text-sm text-ink-muted dark:text-white/70"
                            style={{ fontFamily: getFontFamily('regular') }}
                          >
                            {request.serviceProvided}
                          </Text>
                        </View>
                        <Text
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-xs font-medium',
                            statusStyles[request.status],
                          )}
                          style={{ fontFamily: getFontFamily('medium') }}
                        >
                          {t(`reviewerInvitations.status.${request.status}`)}
                        </Text>
                      </View>

                      {request.proofUrls.length > 0 ? (
                        <View className="mt-3 gap-2">
                          {request.proofUrls.map((url, index) => (
                            <ProofFileRow
                              key={url}
                              name={`${t('reviewerInvitations.viewProof')} ${index + 1}`}
                              onPress={() => openProofUrl(url, `proof-${index + 1}`)}
                            />
                          ))}
                        </View>
                      ) : null}

                      {isPending ? (
                        <View className="mt-3 flex-row flex-wrap gap-2">
                          <Button
                            title={t('reviewerInvitations.edit')}
                            variant="outline"
                            onPress={() => startEdit(request)}
                          />
                          <Button
                            title={t('reviewerInvitations.delete')}
                            variant="outline"
                            onPress={() => deleteRequest(request.id)}
                            loading={deletingId === request.id}
                          />
                        </View>
                      ) : null}
                    </>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>

      <ImageFullscreenViewer
        images={previewImage ? [previewImage] : []}
        visible={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
      />
      {previewDocument ? (
        <DocumentFullscreenViewer
          uri={previewDocument.uri}
          title={previewDocument.title}
          visible
          onClose={() => setPreviewDocument(null)}
        />
      ) : null}
    </>
  );
}
