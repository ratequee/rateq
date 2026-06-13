import { uploadUserFile } from '@/lib/firebase/storage';
import { waitForFirebaseUser } from '@/lib/firebase/wait-for-user';

const MAX_PROOF_FILES = 10;
const MAX_PROOF_FILE_BYTES = 10 * 1024 * 1024;

export async function uploadReviewProofFiles(files: File[]): Promise<string[]> {
  if (files.length > MAX_PROOF_FILES) {
    throw new Error(`You can upload up to ${MAX_PROOF_FILES} proof files`);
  }

  await waitForFirebaseUser();

  const urls: string[] = [];
  for (const file of files) {
    if (file.size > MAX_PROOF_FILE_BYTES) {
      throw new Error('Each proof file must be 10 MB or smaller');
    }
    const url = await uploadUserFile('', 'reviews/proof', file);
    urls.push(url);
  }

  return urls;
}
