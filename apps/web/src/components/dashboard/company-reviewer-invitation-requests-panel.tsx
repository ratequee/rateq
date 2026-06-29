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
import { Loader2, Paperclip, X } from 'lucide-react';
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
  const [requests, setRequests] = useState<ReviewerInvitationRequestPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewerName, setReviewerName] = useState('');
  const [email, setEmail] = useState('');
  const [serviceProvided, setServiceProvided] = useState('');
  const [proofFiles, setProofFiles] = useState<File[]>([]);

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
            {requests.map((request) => (
              <li key={request.id} className="px-4 py-3">
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
