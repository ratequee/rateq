export function getDashboardSearchHref(query: string): string | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const params = new URLSearchParams({ query: trimmed });
  return `/search?${params.toString()}`;
}
