export function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}
