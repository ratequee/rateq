import type { Review, ReviewReply, User } from '@prisma/client';
import type { ReviewPublic, ReviewReplyPublic } from '@rateq/types';
import { ReviewStatus } from '@rateq/types';

type ReviewWithRelations = Review & {
  user?: Pick<User, 'id' | 'email'>;
  replies?: ReviewReply[];
};

export function toReviewReplyPublic(reply: ReviewReply): ReviewReplyPublic {
  return {
    id: reply.id,
    content: reply.content,
    createdAt: reply.createdAt.toISOString(),
  };
}

export function toReviewPublic(review: ReviewWithRelations): ReviewPublic {
  const reply = review.replies?.[0];

  return {
    id: review.id,
    companyId: review.companyId,
    userId: review.userId,
    rating: review.rating,
    title: review.title,
    content: review.content,
    status: review.status as ReviewStatus,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    ...(review.user && {
      author: {
        id: review.user.id,
        email: maskEmail(review.user.email),
      },
    }),
    reply: reply ? toReviewReplyPublic(reply) : null,
  };
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}
