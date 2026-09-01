import { ReviewStatus } from '@rateq/types';

/** Background on container; text color on Text (RN does not inherit color from View). */
export const REVIEW_STATUS_BADGE_STYLES: Record<ReviewStatus, { container: string; text: string }> =
  {
    [ReviewStatus.PENDING]: {
      container: 'bg-amber-100 dark:bg-amber-500/25',
      text: 'text-amber-900 dark:text-amber-100',
    },
    [ReviewStatus.RESOLUTION_PENDING]: {
      container: 'bg-sky-100 dark:bg-sky-500/25',
      text: 'text-sky-900 dark:text-sky-100',
    },
    [ReviewStatus.MODIFIED]: {
      container: 'bg-orange-100 dark:bg-orange-500/25',
      text: 'text-orange-900 dark:text-orange-100',
    },
    [ReviewStatus.PROCEEDED]: {
      container: 'bg-violet-100 dark:bg-violet-500/25',
      text: 'text-violet-900 dark:text-violet-100',
    },
    [ReviewStatus.WITHDRAWN]: {
      container: 'bg-rose-100 dark:bg-rose-500/25',
      text: 'text-rose-900 dark:text-rose-100',
    },
    [ReviewStatus.APPROVED]: {
      container: 'bg-emerald-100 dark:bg-emerald-500/30',
      text: 'text-emerald-900 dark:text-emerald-50',
    },
    [ReviewStatus.REJECTED]: {
      container: 'bg-red-100 dark:bg-red-500/25',
      text: 'text-red-900 dark:text-red-50',
    },
    [ReviewStatus.DELETED]: {
      container: 'bg-slate-200 dark:bg-slate-600/40',
      text: 'text-slate-800 dark:text-slate-100',
    },
  };
