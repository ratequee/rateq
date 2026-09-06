/** Resolve a Storage-rules-safe content type for profile/review uploads. */
export function resolveUploadContentType(
  mimeType: string | null | undefined,
  fileName: string,
  fallback: 'image/jpeg' | 'application/pdf' = 'image/jpeg',
): string {
  const trimmed = (mimeType ?? '').trim().toLowerCase();
  const lowerName = fileName.toLowerCase();

  if (trimmed === 'application/pdf' || lowerName.endsWith('.pdf')) {
    return 'application/pdf';
  }

  if (trimmed.startsWith('image/')) {
    // Some pickers report non-standard types (image/jpg); Storage rules accept image/*.
    if (trimmed === 'image/jpg') return 'image/jpeg';
    return trimmed;
  }

  if (lowerName.endsWith('.png')) return 'image/png';
  if (lowerName.endsWith('.webp')) return 'image/webp';
  if (lowerName.endsWith('.gif')) return 'image/gif';
  if (lowerName.endsWith('.heic') || lowerName.endsWith('.heif')) return 'image/heic';
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.jpe')) {
    return 'image/jpeg';
  }

  // Never send application/octet-stream — Storage rules reject it for proof paths.
  if (!trimmed || trimmed === 'application/octet-stream' || !trimmed.includes('/')) {
    return fallback;
  }

  return fallback;
}

export function isFirebaseStoragePermissionError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code: unknown }).code);
    if (code === 'storage/unauthorized' || code === 'storage/unauthenticated') {
      return true;
    }
  }

  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('permission denied') ||
    message.includes('unauthorized') ||
    message.includes('unauthenticated') ||
    message.includes('403')
  );
}

export function getUploadErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    const message = error.message.trim();
    if (isFirebaseStoragePermissionError(error)) {
      return `${message}. Make sure you are signed in and the file is a JPG, PNG, or PDF under 10 MB.`;
    }
    return message;
  }

  return fallback;
}
