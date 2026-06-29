'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { onboardingApi } from '@/lib/onboarding-api';
import {
  uploadInvitationProofFiles,
  MAX_INVITATION_PROOF_FILES,
} from '@/lib/invitation-proof-upload';
import { ApiError } from '@/lib/api';
import type { ReviewerInvitationRequestPublic } from '@rateq/types';
import { Loader2, Paperclip, Pencil, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  rejected: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400',
};

export function CompanyReviewerInvitationRequestsPanel() {
  const t = useTranslations('reviewerInvitations');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [requests, setRequests] = useState<ReviewerInvitationRequestPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewerName, setReviewerName] = useState('');
  const [email, setEmail] = useState('');
  const [serviceProvided, setServiceProvided] = useState('');
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editReviewerName, setEditReviewerName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editServiceProvided, setEditServiceProvided] = useState('');
  const [keptProofUrls, setKeptProofUrls] = useState<string[]>([]);
  const [editProofFiles, setEditProofFiles] = useState<File[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setRequests(await onboardingApi.listReviewerInvitationRequests());
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addProofFiles = (files: FileList | null) => {
    if (!files?.length) return;
    setProofFiles((current) => {
      const next = [...current, ...Array.from(files)];
      return next.slice(0, MAX_INVITATION_PROOF_FILES);
    });
  };

  const addEditProofFiles = (files: FileList | null) => {
    if (!files?.length) return;
    setEditProofFiles((current) => {
      const next = [...current, ...Array.from(files)];
      const maxNew = MAX_INVITATION_PROOF_FILES - keptProofUrls.length;
      return next.slice(0, Math.max(0, maxNew));
    });
  };

  const resetEditState = () => {
    setEditingId(null);
    setEditReviewerName('');
    setEditEmail('');
    setEditServiceProvided('');
    setKeptProofUrls([]);
    setEditProofFiles([]);
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  };

  const startEdit = (request: ReviewerInvitationRequestPublic) => {
    setEditingId(request.id);
    setEditReviewerName(request.reviewerName);
    setEditEmail(request.email);
    setEditServiceProvided(request.serviceProvided);
    setKeptProofUrls([...request.proofUrls]);
    setEditProofFiles([]);
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!reviewerName.trim() || !email.trim() || !serviceProvided.trim()) {
      toast.error(t('fieldsRequired'));
      return;
    }

    if (proofFiles.length === 0) {
      toast.error(t('proofRequired'));
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
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success(t('submitted'));
      await reload();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : t('submitError');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const saveEdit = async (requestId: string) => {
    if (!editReviewerName.trim() || !editEmail.trim() || !editServiceProvided.trim()) {
      toast.error(t('fieldsRequired'));
      return;
    }

    if (keptProofUrls.length + editProofFiles.length === 0) {
      toast.error(t('proofRequired'));
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
      toast.success(t('updated'));
      resetEditState();
      await reload();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : t('updateError');
      toast.error(message);
    } finally {
      setSavingId(null);
    }
  };

  const deleteRequest = async (requestId: string) => {
    if (!window.confirm(t('deleteConfirm'))) return;

    setDeletingId(requestId);
    try {
      await onboardingApi.deleteReviewerInvitationRequest(requestId);
      if (editingId === requestId) resetEditState();
      toast.success(t('deleted'));
      await reload();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : t('deleteError');
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="rounded-2xl surface-card border p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-primary">{t('title')}</h2>
      <p className="mt-1 text-sm text-secondary">{t('subtitle')}</p>

      <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">
        <Input
          value={reviewerName}
          onChange={(event) => setReviewerName(event.target.value)}
          placeholder={t('reviewerNamePlaceholder')}
          className="h-11"
        />
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t('emailPlaceholder')}
          className="h-11"
        />
        <textarea
          value={serviceProvided}
          onChange={(event) => setServiceProvided(event.target.value)}
          rows={4}
          maxLength={2000}
          placeholder={t('servicePlaceholder')}
          className="select-field w-full py-2"
        />
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            className="hidden"
            onChange={(event) => addProofFiles(event.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={proofFiles.length >= MAX_INVITATION_PROOF_FILES}
          >
            <Paperclip className="h-4 w-4" />
            {t('addProof')}
          </Button>
          <p className="mt-2 text-xs text-secondary">{t('proofHint')}</p>
          {proofFiles.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {proofFiles.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-subtle px-3 py-2 text-sm"
                >
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setProofFiles((current) => current.filter((_, i) => i !== index))
                    }
                    className="text-secondary hover:text-red-600"
                    aria-label={t('removeProof')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('submit')}
        </Button>
      </form>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-primary">{t('recentRequests')}</h3>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
          </div>
        ) : requests.length === 0 ? (
          <p className="mt-3 text-sm text-secondary">{t('empty')}</p>
        ) : (
          <ul className="mt-3 divide-y divide-subtle rounded-xl border border-subtle">
            {requests.map((request) => {
              const isEditing = editingId === request.id;
              const isPending = request.status === 'pending';

              return (
                <li key={request.id} className="px-4 py-3">
                  {isEditing ? (
                    <div className="space-y-4">
                      <Input
                        value={editReviewerName}
                        onChange={(event) => setEditReviewerName(event.target.value)}
                        placeholder={t('reviewerNamePlaceholder')}
                        className="h-11"
                      />
                      <Input
                        type="email"
                        value={editEmail}
                        onChange={(event) => setEditEmail(event.target.value)}
                        placeholder={t('emailPlaceholder')}
                        className="h-11"
                      />
                      <textarea
                        value={editServiceProvided}
                        onChange={(event) => setEditServiceProvided(event.target.value)}
                        rows={4}
                        maxLength={2000}
                        placeholder={t('servicePlaceholder')}
                        className="select-field w-full py-2"
                      />
                      {keptProofUrls.length > 0 ? (
                        <div>
                          <p className="text-xs font-medium text-secondary">{t('existingProof')}</p>
                          <ul className="mt-2 space-y-2">
                            {keptProofUrls.map((url, index) => (
                              <li
                                key={url}
                                className="flex items-center justify-between gap-2 rounded-lg border border-subtle px-3 py-2 text-sm"
                              >
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="truncate text-brand-600 hover:underline"
                                >
                                  {t('viewProof')} {index + 1}
                                </a>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setKeptProofUrls((current) =>
                                      current.filter((item) => item !== url),
                                    )
                                  }
                                  className="text-secondary hover:text-red-600"
                                  aria-label={t('removeProof')}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      <div>
                        <input
                          ref={editFileInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          multiple
                          className="hidden"
                          onChange={(event) => addEditProofFiles(event.target.files)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => editFileInputRef.current?.click()}
                          disabled={
                            keptProofUrls.length + editProofFiles.length >=
                            MAX_INVITATION_PROOF_FILES
                          }
                        >
                          <Paperclip className="h-4 w-4" />
                          {t('addProof')}
                        </Button>
                        {editProofFiles.length > 0 ? (
                          <ul className="mt-2 space-y-2">
                            {editProofFiles.map((file, index) => (
                              <li
                                key={`${file.name}-${index}`}
                                className="flex items-center justify-between rounded-lg border border-subtle px-3 py-2 text-sm"
                              >
                                <span className="truncate">{file.name}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditProofFiles((current) =>
                                      current.filter((_, i) => i !== index),
                                    )
                                  }
                                  className="text-secondary hover:text-red-600"
                                  aria-label={t('removeProof')}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={savingId === request.id}
                          onClick={() => void saveEdit(request.id)}
                        >
                          {savingId === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            t('save')
                          )}
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={resetEditState}>
                          {t('cancel')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-primary">{request.reviewerName}</p>
                          <p className="text-sm text-secondary">{request.email}</p>
                          <p className="mt-1 line-clamp-2 text-sm text-secondary">
                            {request.serviceProvided}
                          </p>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[request.status]}`}
                        >
                          {t(`status.${request.status}`)}
                        </span>
                      </div>
                      {isPending ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => startEdit(request)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            {t('edit')}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-red-600 hover:text-red-700"
                            disabled={deletingId === request.id}
                            onClick={() => void deleteRequest(request.id)}
                          >
                            {deletingId === request.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            {t('delete')}
                          </Button>
                        </div>
                      ) : null}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
