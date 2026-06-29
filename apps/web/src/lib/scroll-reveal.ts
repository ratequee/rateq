export type ScrollRevealAnimation =
  | 'fade-up'
  | 'fade-in'
  | 'fade-left'
  | 'fade-right'
  | 'scale-up'
  | 'pop-up';

export function scrollStaggerDelay(index: number, stepMs = 80): number {
  return index * stepMs;
}

export function scrollRevealProps(
  animation: ScrollRevealAnimation = 'fade-up',
  delayMs?: number,
): {
  'data-scroll-reveal': ScrollRevealAnimation;
  'data-scroll-delay'?: number;
} {
  return {
    'data-scroll-reveal': animation,
    ...(delayMs != null && delayMs > 0 ? { 'data-scroll-delay': delayMs } : {}),
  };
}
