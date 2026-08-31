import type { ReviewAuthor } from '@rateq/types';

export function getReviewAuthorName(author: ReviewAuthor | undefined, fallback: string): string {
  const name = author?.displayName?.trim();
  return name || fallback;
}

export function getReviewAuthorInitial(name: string): string {
  return name.charAt(0).toUpperCase() || '?';
}
