import { ensureFirebaseUserForUpload } from '@/lib/firebase/ensure-user';
import { uploadUserFile } from '@/lib/firebase/storage';
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

  await ensureFirebaseUserForUpload();

  const urls: string[] = [];
  for (const file of files) {
    await assertProofFileWithinLimit(file);
    const url = await uploadUserFile(
      'company/invitation-proof',
      file.uri,
      file.name,
      file.mimeType,
    );
    urls.push(url);
  }

  return urls;
}
