import { uploadUserFile } from '@/lib/firebase/storage';
import { waitForFirebaseUser } from '@/lib/firebase/wait-for-user';

const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

export function isCategoryIconFile(file: File): boolean {
  return IMAGE_TYPES.has(file.type);
}

export async function uploadCategoryIcon(file: File): Promise<string> {
  if (!isCategoryIconFile(file)) {
    throw new Error('Unsupported image type');
  }

  await waitForFirebaseUser();
  return uploadUserFile('', 'admin/categories/icon', file);
}
