'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StarRating } from '@/components/ui/star-rating';
import { ApiError, reviewsApi } from '@/lib/api';
import { isAccountDeactivatedApiError } from '@/lib/account-status';
import { ensureValidAccessToken } from '@/lib/auth-session';
import { uploadReviewProofFiles } from '@/lib/review-proof-upload';
import { getDeviceFingerprint } from '@/lib/device-fingerprint';
import {
  sanitizeReviewContent,
  sanitizeReviewTitle,
  validateReviewFields,
  type ReviewFieldErrors,
} from '@/lib/validation/review-fields';
import type { CompanyCatalogLabel, ReviewPublic } from '@rateq/types';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const EMPTY_COMPANY_SERVICES: CompanyCatalogLabel[] = [];

interface WriteReviewFormProps {
  companyId: string;
  companyServices?: CompanyCatalogLabel[];
  className?: string;
  onSubmitted?: (review: ReviewPublic) => void;
  onCancel?: () => void;
}

function buildDefaultServiceRatings(services: CompanyCatalogLabel[]): Record<string, number> {
  return Object.fromEntries(services.map((service) => [service.id, 5]));
}

export function WriteReviewForm({
  companyId,
  companyServices = EMPTY_COMPANY_SERVICES,
  className,
  onSubmitted,
  onCancel,
}: WriteReviewFormProps) {
  const t = useTranslations('review');
  const [overallRating, setOverallRating] = useState(5);
  const [serviceRatings, setServiceRatings] = useState<Record<string, number>>(() =>
    buildDefaultServiceRatings(companyServices),
  );
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ReviewFieldErrors>({});

  const usesServiceRatings = companyServices.length > 0;

  const aggregatedPreview = useMemo(() => {
    if (!usesServiceRatings) return overallRating;
    const values = companyServices.map((service) => serviceRatings[service.id] ?? 0);
    if (values.some((value) => value < 1)) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }, [companyServices, overallRating, serviceRatings, usesServiceRatings]);

  const handleProofChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setProofFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateReviewFields(
      { title, content },
      {
        title: {
          required: t('validation.titleRequired'),
          min: t('validation.titleMin'),
          max: t('validation.titleMax'),
          invalid: t('validation.titleInvalid'),
        },
        content: {
          required: t('validation.contentRequired'),
          min: t('validation.contentMin'),
          max: t('validation.contentMax'),
          invalid: t('validation.contentInvalid'),
        },
      },
    );

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (!proofFile) {
      toast.error(t('validation.proofRequired'));
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      const token = await ensureValidAccessToken();
      if (!token) throw new Error('Not authenticated');

      const proofUrls = await uploadReviewProofFiles([proofFile]);
      const deviceFingerprint = await getDeviceFingerprint();

      const review = await reviewsApi.submit(token, {
        companyId,
        title,
        content,
        ...(deviceFingerprint ? { deviceFingerprint } : {}),
        ...(usesServiceRatings
          ? {
              serviceRatings: companyServices.map((service) => ({
                catalogItemId: service.id,
                rating: serviceRatings[service.id] ?? 5,
              })),
            }
          : { rating: overallRating }),
        proofUrls,
      });

      toast.success(t('submittedSuccess'), { description: t('submittedPendingNote') });
      setTitle('');
      setContent('');
      setOverallRating(5);
      setProofFile(null);
      setServiceRatings(buildDefaultServiceRatings(companyServices));
      onSubmitted?.(review);
    } catch (err) {
      if (isAccountDeactivatedApiError(err)) {
        toast.error(t('accountDeactivated'));
        return;
      }

      const message = err instanceof ApiError ? err.message : t('submitError');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle>{t('submit')}</CardTitle>
        {onCancel ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            {t('cancel')}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {usesServiceRatings ? (
            <div className="space-y-4">
              <p className="text-sm text-secondary">{t('serviceRatingsHint')}</p>
              {companyServices.map((service) => (
                <div key={service.id}>
                  <label className="text-sm font-medium text-primary">{service.label}</label>
                  <StarRating
                    value={serviceRatings[service.id] ?? 5}
                    interactive
                    onChange={(value) =>
                      setServiceRatings((current) => ({ ...current, [service.id]: value }))
                    }
                  />
                </div>
              ))}
              <p className="text-sm text-secondary">
                {t('aggregatedRating', { rating: aggregatedPreview })}
              </p>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-primary">{t('rating')}</label>
              <StarRating value={overallRating} interactive onChange={setOverallRating} />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-primary">{t('title')}</label>
            <Input
              value={title}
              onChange={(e) => setTitle(sanitizeReviewTitle(e.target.value))}
              onBlur={() => setTitle((prev) => prev.trim())}
              aria-invalid={Boolean(fieldErrors.title)}
            />
            {fieldErrors.title ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-primary">{t('content')}</label>
            <textarea
              value={content}
              onChange={(e) => setContent(sanitizeReviewContent(e.target.value))}
              rows={4}
              aria-invalid={Boolean(fieldErrors.content)}
              className="textarea-field mt-1"
            />
            {fieldErrors.content ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.content}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary">
              {t('proofFiles')}
            </label>
            <Input type="file" accept="image/*,.pdf" onChange={handleProofChange} required />
            <p className="mt-1 text-xs text-secondary">{t('proofFilesHint')}</p>
            {proofFile ? <p className="mt-2 text-xs text-secondary">{proofFile.name}</p> : null}
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? '...' : t('submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
