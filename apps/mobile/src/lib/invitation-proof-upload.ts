import { uploadUserFile } from '@/lib/firebase/storage';
import { resolveUploadContentType } from '@/lib/firebase/upload-content-type';
import type { ReviewProofFile } from '@/lib/review-proof-upload';
import { assertProofFileWithinLimit } from '@/lib/review-proof-upload';

export const MAX_INVITATION_PROOF_FILES = 8;

export async function uploadInvitationProofFiles(files: ReviewProofFile[]): Promise<string[]> {
  if (!files.length) {
    throw new Error('At least one proof file is required');
  }

  if (files.length > MAX_INVITATION_PROOF_FILES) {
    throw new Error(`You can upload up to ${MAX_INVITATION_PROOF_FILES} proof files`);
  }

  const urls: string[] = [];
  for (const file of files) {
    await assertProofFileWithinLimit(file);
    const mimeType = resolveUploadContentType(file.mimeType, file.name);
    const url = await uploadUserFile('company/invitation-proof', file.uri, file.name, mimeType);
    urls.push(url);
  }

  return urls;
}
