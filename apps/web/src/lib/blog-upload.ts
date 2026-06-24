import { uploadUserFile } from '@/lib/firebase/storage';
import { waitForFirebaseUser } from '@/lib/firebase/wait-for-user';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export function isBlogImageFile(file: File): boolean {
  return IMAGE_TYPES.has(file.type);
}

export async function uploadBlogCoverImage(file: File): Promise<string> {
  if (!isBlogImageFile(file)) {
    throw new Error('Unsupported image type');
  }

  await waitForFirebaseUser();
  return uploadUserFile('', 'blog/cover', file);
}
