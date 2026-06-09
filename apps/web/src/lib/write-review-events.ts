export const OPEN_WRITE_REVIEW_EVENT = 'rateq:open-write-review';

export function dispatchOpenWriteReview(): void {
  window.dispatchEvent(new CustomEvent(OPEN_WRITE_REVIEW_EVENT));
}
