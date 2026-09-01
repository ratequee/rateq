import { ReviewProofPicker } from '@/components/review/review-proof-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/components/ui/star-rating';
import { getFontFamily } from '@/i18n';
import { useAppToast } from '@/hooks/use-app-toast';
import { reviewsApi } from '@/lib/api';
import { uploadReviewProofFiles, type ReviewProofFile } from '@/lib/review-proof-upload';
import {
  hasReviewValidationErrors,
  sanitizeReviewContent,
  sanitizeReviewTitle,
  validateReviewFields,
  type ReviewFieldErrors,
} from '@/lib/validation/review-fields';
import type { ReviewPublic } from '@rateq/types';
import { ReviewStatus } from '@rateq/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, View } from 'react-native';

interface WriteReviewFormProps {
  companyId: string;
  lastInactiveReview?: ReviewPublic | null;
  onSubmitted: () => void;
}

export function WriteReviewForm({
  companyId,
  lastInactiveReview,
  onSubmitted,
}: WriteReviewFormProps) {
  const { t } = useTranslation();
  const toast = useAppToast();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [proofFiles, setProofFiles] = useState<ReviewProofFile[]>([]);
  const [errors, setErrors] = useState<ReviewFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const inactiveHint =
    lastInactiveReview?.status === ReviewStatus.WITHDRAWN
      ? t('review.withdrawnReviewAgainHint')
      : lastInactiveReview
        ? t('review.reviewAgainHint')
        : null;

  const handleSubmit = async () => {
    const fieldErrors = validateReviewFields(
      { title, content },
      {
        title: {
          required: t('review.validation.titleRequired'),
          min: t('review.validation.titleMin'),
          max: t('review.validation.titleMax'),
        },
        content: {
          required: t('review.validation.contentRequired'),
          min: t('review.validation.contentMin'),
          max: t('review.validation.contentMax'),
        },
      },
    );

    if (!proofFiles.length) {
      fieldErrors.proof = t('review.validation.proofRequired');
    }

    setErrors(fieldErrors);
    if (hasReviewValidationErrors(fieldErrors)) {
      toast.error(t('review.validation.fixForm'));
      return;
    }

    setSubmitting(true);
    try {
      const proofUrls = await uploadReviewProofFiles(proofFiles);
      await reviewsApi.submit({
        companyId,
        rating,
        title: sanitizeReviewTitle(title).trim(),
        content: sanitizeReviewContent(content).trim(),
        proofUrls,
      });

      toast.success(t('review.submittedPendingNote'), t('review.submittedSuccess'));
      onSubmitted();
    } catch (err) {
      toast.apiError(err, t('review.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="gap-5">
      {inactiveHint ? (
        <View className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">
          <Text
            className="text-sm leading-5 text-amber-900 dark:text-amber-100"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {inactiveHint}
          </Text>
        </View>
      ) : null}

      <View>
        <Label>{t('review.rating')}</Label>
        <View className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-dm-border dark:bg-dm-elevated">
          <StarRating value={rating} onChange={setRating} size={32} />
        </View>
      </View>

      <View>
        <Label required>{t('review.title')}</Label>
        <Input
          value={title}
          onChangeText={(value) => setTitle(sanitizeReviewTitle(value))}
          placeholder={t('review.titlePlaceholder')}
          className="mt-1 rounded-2xl bg-slate-50 dark:bg-dm-elevated"
        />
        {errors.title ? (
          <Text
            className="mt-1 text-sm text-red-500"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {errors.title}
          </Text>
        ) : null}
      </View>

      <View>
        <Label required>{t('review.content')}</Label>
        <TextInput
          value={content}
          onChangeText={(value) => setContent(sanitizeReviewContent(value))}
          multiline
          numberOfLines={6}
          placeholder={t('review.contentPlaceholder')}
          className="mt-1 min-h-[140px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-ink dark:border-dm-border dark:bg-dm-elevated dark:text-white"
          textAlignVertical="top"
          style={{ fontFamily: getFontFamily('regular') }}
        />
        {errors.content ? (
          <Text
            className="mt-1 text-sm text-red-500"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {errors.content}
          </Text>
        ) : null}
      </View>

      <ReviewProofPicker
        files={proofFiles}
        onAdd={(file) => setProofFiles((current) => [...current, file])}
        onRemove={(index) => setProofFiles((current) => current.filter((_, i) => i !== index))}
        error={errors.proof}
      />

      <Button
        title={submitting ? t('review.submitting') : t('review.submit')}
        variant="gold"
        className="rounded-2xl"
        onPress={() => void handleSubmit()}
        loading={submitting}
      />
    </View>
  );
}
