export function formatReviewTimeAgo(isoDate: string, locale: string): string {
  const date = new Date(isoDate);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(0, 'day');
  }

  if (diffDays < 7) {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-diffDays, 'day');
  }

  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-weeks, 'week');
  }

  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}
