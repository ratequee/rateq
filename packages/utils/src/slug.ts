/**
 * Generates a URL-safe slug from a company name.
 */
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/**
 * Ensures slug uniqueness by appending a numeric suffix when needed.
 */
export function withSlugSuffix(base: string, attempt: number): string {
  if (attempt <= 0) return base;
  return `${base}-${attempt}`;
}
