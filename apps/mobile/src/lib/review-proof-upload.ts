import { ensureFirebaseUserForUpload } from '@/lib/firebase/ensure-user';
import { uploadUserFile } from '@/lib/firebase/storage';

export const MAX_REVIEW_PROOF_FILES = 8;
const MAX_PROOF_FILE_BYTES = 10 * 1024 * 1024;

export type ReviewProofFile = {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
};

export function isReviewProofFileWithinLimit(size: number): boolean {
  return size > 0 && size <= MAX_PROOF_FILE_BYTES;
}

export async function uploadReviewProofFiles(files: ReviewProofFile[]): Promise<string[]> {
  if (!files.length) {
    throw new Error('At least one proof file is required');
  }

  if (files.length > MAX_REVIEW_PROOF_FILES) {
    throw new Error(`You can upload up to ${MAX_REVIEW_PROOF_FILES} proof files`);
  }

  await ensureFirebaseUserForUpload();

  const urls: string[] = [];
  for (const file of files) {
    if (!isReviewProofFileWithinLimit(file.size)) {
      throw new Error('Each proof file must be 10 MB or smaller');
    }
    const url = await uploadUserFile('reviews/proof', file.uri, file.name, file.mimeType);
    urls.push(url);
  }

  return urls;
}
