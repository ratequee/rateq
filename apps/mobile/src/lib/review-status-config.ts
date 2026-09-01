import { ReviewStatus } from '@rateq/types';
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface ReviewStatusVisual {
  messageKey: string;
  labelKey: string;
  icon: IoniconName;
  containerClass: string;
  iconColor: string;
}

export const REVIEW_STATUS_CONFIG: Record<ReviewStatus, ReviewStatusVisual> = {
  [ReviewStatus.PENDING]: {
    messageKey: 'review.myReviewPending',
    labelKey: 'review.statusLabel.PENDING',
    icon: 'time-outline',
    containerClass: 'border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30',
    iconColor: '#d97706',
  },
  [ReviewStatus.RESOLUTION_PENDING]: {
    messageKey: 'review.myReviewResolutionPending',
    labelKey: 'review.statusLabel.RESOLUTION_PENDING',
    icon: 'chatbubble-ellipses-outline',
    containerClass: 'border-sky-200 bg-sky-50 dark:border-sky-900/60 dark:bg-sky-950/30',
    iconColor: '#0284c7',
  },
  [ReviewStatus.MODIFIED]: {
    messageKey: 'review.myReviewModified',
    labelKey: 'review.statusLabel.MODIFIED',
    icon: 'create-outline',
    containerClass:
      'border-orange-200 bg-orange-50 dark:border-orange-900/60 dark:bg-orange-950/30',
    iconColor: '#ea580c',
  },
  [ReviewStatus.PROCEEDED]: {
    messageKey: 'review.myReviewProceeded',
    labelKey: 'review.statusLabel.PROCEEDED',
    icon: 'arrow-forward-circle-outline',
    containerClass:
      'border-violet-200 bg-violet-50 dark:border-violet-900/60 dark:bg-violet-950/30',
    iconColor: '#7c3aed',
  },
  [ReviewStatus.WITHDRAWN]: {
    messageKey: 'review.myReviewWithdrawn',
    labelKey: 'review.statusLabel.WITHDRAWN',
    icon: 'close-circle-outline',
    containerClass: 'border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/30',
    iconColor: '#e11d48',
  },
  [ReviewStatus.APPROVED]: {
    messageKey: 'review.myReviewApproved',
    labelKey: 'review.statusLabel.APPROVED',
    icon: 'checkmark-circle-outline',
    containerClass:
      'border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30',
    iconColor: '#059669',
  },
  [ReviewStatus.REJECTED]: {
    messageKey: 'review.myReviewRejected',
    labelKey: 'review.statusLabel.REJECTED',
    icon: 'close-circle-outline',
    containerClass: 'border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30',
    iconColor: '#dc2626',
  },
  [ReviewStatus.DELETED]: {
    messageKey: 'review.myReviewDeleted',
    labelKey: 'review.statusLabel.DELETED',
    icon: 'trash-outline',
    containerClass: 'border-slate-200 bg-slate-50 dark:border-dm-border dark:bg-dm-elevated',
    iconColor: '#64748b',
  },
};
