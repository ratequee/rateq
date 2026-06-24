'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StarRating } from '@/components/ui/star-rating';
import { ApiError, reviewsApi } from '@/lib/api';
import { isAccountDeactivatedApiError } from '@/lib/account-status';
import { ensureValidAccessToken } from '@/lib/auth-session';
import { fetchCategoryServicesClient } from '@/lib/categories-api';
import { uploadReviewProofFiles } from '@/lib/review-proof-upload';
import { getDeviceFingerprint } from '@/lib/device-fingerprint';
import {
  sanitizeReviewContent,
  sanitizeReviewTitle,
  validateReviewFields,
  type ReviewFieldErrors,
} from '@/lib/validation/review-fields';
import type { CategoryServicePublic, ReviewPublic } from '@rateq/types';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const EMPTY_CATEGORY_SERVICES: CategoryServicePublic[] = [];

interface WriteReviewFormProps {
  companyId: string;
  categoryId?: string | null;
  categoryServices?: CategoryServicePublic[];
  className?: string;
  onSubmitted?: (review: ReviewPublic) => void;
  onCancel?: () => void;
}

function buildDefaultServiceRatings(services: CategoryServicePublic[]): Record<string, number> {
  return Object.fromEntries(services.map((service) => [service.id, 5]));
}

export function WriteReviewForm({
  companyId,
  categoryId,
  categoryServices: initialCategoryServices = EMPTY_CATEGORY_SERVICES,
  className,
  onSubmitted,
  onCancel,
}: WriteReviewFormProps) {
  const t = useTranslations('review');
  const [overallRating, setOverallRating] = useState(5);
  const [categoryServices, setCategoryServices] =
    useState<CategoryServicePublic[]>(initialCategoryServices);
  const [serviceRatings, setServiceRatings] = useState<Record<string, number>>(() =>
    buildDefaultServiceRatings(initialCategoryServices),
  );
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ReviewFieldErrors>({});
  const initialServicesKey = initialCategoryServices.map((service) => service.id).join(',');

  useEffect(() => {
    if (initialCategoryServices.length > 0) {
      setCategoryServices(initialCategoryServices);
      setServiceRatings(buildDefaultServiceRatings(initialCategoryServices));
      return;
    }

    if (!categoryId) {
      setCategoryServices(EMPTY_CATEGORY_SERVICES);
      setServiceRatings({});
      return;
    }

    let cancelled = false;

    void fetchCategoryServicesClient(categoryId).then((services) => {
      if (cancelled) return;

      setCategoryServices(services);
      setServiceRatings(buildDefaultServiceRatings(services));
    });

    return () => {
      cancelled = true;
    };
  }, [categoryId, initialServicesKey, initialCategoryServices]);

  const usesServiceRatings = categoryServices.length > 0;

  const aggregatedPreview = useMemo(() => {
    if (!usesServiceRatings) return overallRating;
    const values = categoryServices.map((service) => serviceRatings[service.id] ?? 0);
    if (values.some((value) => value < 1)) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }, [categoryServices, overallRating, serviceRatings, usesServiceRatings]);

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
              serviceRatings: categoryServices.map((service) => ({
                categoryServiceId: service.id,
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
      setServiceRatings(buildDefaultServiceRatings(categoryServices));
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
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            {t('cancel')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {usesServiceRatings ? (
            <div className="space-y-4">
              <p className="text-sm text-ink-muted">{t('serviceRatingsHint')}</p>
              {categoryServices.map((service) => (
                <div key={service.id}>
                  <label className="text-sm font-medium">{service.name}</label>
                  <StarRating
                    value={serviceRatings[service.id] ?? 5}
                    interactive
                    onChange={(value) =>
                      setServiceRatings((current) => ({ ...current, [service.id]: value }))
                    }
                  />
                </div>
              ))}
              <p className="text-sm text-ink-muted">
                {t('aggregatedRating', { rating: aggregatedPreview })}
              </p>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium">{t('rating')}</label>
              <StarRating value={overallRating} interactive onChange={setOverallRating} />
            </div>
          )}

          <div>
            <label className="text-sm font-medium">{t('title')}</label>
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
            <label className="text-sm font-medium">{t('content')}</label>
            <textarea
              value={content}
              onChange={(e) => setContent(sanitizeReviewContent(e.target.value))}
              rows={4}
              aria-invalid={Boolean(fieldErrors.content)}
              className="mt-1 w-full rounded-md border border-default bg-white px-3 py-2 text-sm text-primary focus:ring-2 focus:ring-brand-500 dark:bg-slate-900"
            />
            {fieldErrors.content ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.content}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">{t('proofFiles')}</label>
            <Input type="file" accept="image/*,.pdf" onChange={handleProofChange} required />
            <p className="mt-1 text-xs text-ink-muted">{t('proofFilesHint')}</p>
            {proofFile ? <p className="mt-2 text-xs text-ink-muted">{proofFile.name}</p> : null}
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? '...' : t('submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
