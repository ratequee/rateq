import { uploadUserFile } from '@/lib/firebase/storage';
import { waitForFirebaseUser } from '@/lib/firebase/wait-for-user';

export type CompanyAssetKey = 'registration' | 'logo' | 'cover';

export interface CompanyExistingAssets {
  registrationDocUrl: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
}

export function isRemotePdf(url: string): boolean {
  const path = url.split('?')[0]?.toLowerCase() ?? '';
  return path.endsWith('.pdf');
}

export function isRemoteImage(url: string): boolean {
  const path = url.split('?')[0]?.toLowerCase() ?? '';
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/.test(path);
}

export async function resolveCompanyAssetUrl(
  newFile: File | null,
  existingUrl: string | null,
  uploadFolder: string,
): Promise<string | null> {
  if (newFile) {
    await waitForFirebaseUser();
    return uploadUserFile('', uploadFolder, newFile);
  }
  if (existingUrl?.trim()) {
    return existingUrl;
  }
  return null;
}

export async function resolveCompanyDocumentUrls(input: {
  registrationFile: File | null;
  logoFile: File | null;
  coverFile: File | null;
  existing: CompanyExistingAssets;
}): Promise<{
  registrationDocUrl: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
}> {
  const [registrationDocUrl, logoUrl, coverUrl] = await Promise.all([
    resolveCompanyAssetUrl(
      input.registrationFile,
      input.existing.registrationDocUrl,
      'company/registration',
    ),
    resolveCompanyAssetUrl(input.logoFile, input.existing.logoUrl, 'company/logo'),
    resolveCompanyAssetUrl(input.coverFile, input.existing.coverUrl, 'company/cover'),
  ]);

  return { registrationDocUrl, logoUrl, coverUrl };
}
