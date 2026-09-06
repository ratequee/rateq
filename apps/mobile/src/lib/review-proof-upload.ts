import { uploadUserFile } from '@/lib/firebase/storage';
import { resolveUploadContentType } from '@/lib/firebase/upload-content-type';
import * as FileSystem from 'expo-file-system/legacy';

export const MAX_REVIEW_PROOF_FILES = 8;
export const MAX_PROOF_FILE_BYTES = 10 * 1024 * 1024;

export type ReviewProofFile = {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
};

export function isReviewProofFileWithinLimit(size: number | null | undefined): boolean {
  if (!size || size <= 0) return true;
  return size <= MAX_PROOF_FILE_BYTES;
}

export async function resolveProofFileSize(
  uri: string,
  reportedSize?: number | null,
): Promise<number> {
  if (reportedSize && reportedSize > 0) return reportedSize;

  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists && typeof info.size === 'number' && info.size > 0) {
      return info.size;
    }
  } catch {
    // Expo may not expose size for some URI schemes until upload.
  }

  return reportedSize ?? 0;
}

export async function createReviewProofFile(input: {
  uri: string;
  name: string;
  mimeType: string;
  reportedSize?: number | null;
}): Promise<ReviewProofFile> {
  const size = await resolveProofFileSize(input.uri, input.reportedSize);
  return {
    uri: input.uri,
    name: input.name,
    mimeType: resolveUploadContentType(input.mimeType, input.name),
    size,
  };
}

export async function assertProofFileWithinLimit(file: ReviewProofFile): Promise<void> {
  const size = await resolveProofFileSize(file.uri, file.size);
  if (size > MAX_PROOF_FILE_BYTES) {
    throw new Error('Each proof file must be 10 MB or smaller');
  }
}

export async function uploadReviewProofFiles(files: ReviewProofFile[]): Promise<string[]> {
  if (!files.length) {
    throw new Error('At least one proof file is required');
  }

  if (files.length > MAX_REVIEW_PROOF_FILES) {
    throw new Error(`You can upload up to ${MAX_REVIEW_PROOF_FILES} proof files`);
  }

  const urls: string[] = [];
  for (const file of files) {
    await assertProofFileWithinLimit(file);
    const mimeType = resolveUploadContentType(file.mimeType, file.name);
    const url = await uploadUserFile('reviews/proof', file.uri, file.name, mimeType);
    urls.push(url);
  }

  return urls;
}
