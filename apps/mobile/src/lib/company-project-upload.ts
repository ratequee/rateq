import { ensureFirebaseUserForUpload } from '@/lib/firebase/ensure-user';
import { uploadUserFile } from '@/lib/firebase/storage';
import type { PickedFile } from '@/lib/profile-company-assets';

export const MAX_COMPANY_PROJECTS = 12;
export const MAX_PROJECT_DEMO_IMAGES = 8;
export const MAX_PROJECT_CUSTOM_SERVICES = 5;

export async function uploadProjectCoverImage(file: PickedFile): Promise<string> {
  await ensureFirebaseUserForUpload();
  return uploadUserFile('company/projects', file.uri, file.name, file.mimeType);
}

export async function uploadProjectDemoImage(file: PickedFile): Promise<string> {
  await ensureFirebaseUserForUpload();
  const demoName = file.name.startsWith('demo-') ? file.name : `demo-${file.name}`;
  return uploadUserFile('company/projects', file.uri, demoName, file.mimeType);
}
