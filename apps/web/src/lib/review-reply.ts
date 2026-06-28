import { ReviewReplyStatus, ReviewStatus, type ReviewPublic } from '@rateq/types';

export function canCompanyReplyToReview(review: ReviewPublic): boolean {
  if (review.status !== ReviewStatus.APPROVED) return false;
  if (!review.reply) return true;
  return review.reply.status === ReviewReplyStatus.REJECTED;
}
