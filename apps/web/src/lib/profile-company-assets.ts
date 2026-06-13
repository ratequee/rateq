import { uploadUserFile } from '@/lib/firebase/storage';
import { waitForFirebaseUser } from '@/lib/firebase/wait-for-user';

export type CompanyAssetKey =
  | 'registration'
  | 'establishmentCard'
  | 'tradeLicense'
  | 'logo'
  | 'cover';

export interface CompanyExistingAssets {
  establishmentCardUrl: string | null;
  tradeLicenseUrl: string | null;
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
  establishmentCardFile: File | null;
  tradeLicenseFile: File | null;
  logoFile: File | null;
  coverFile: File | null;
  existing: CompanyExistingAssets;
}): Promise<{
  establishmentCardUrl: string | null;
  tradeLicenseUrl: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
}> {
  const [establishmentCardUrl, tradeLicenseUrl, logoUrl, coverUrl] = await Promise.all([
    resolveCompanyAssetUrl(
      input.establishmentCardFile,
      input.existing.establishmentCardUrl,
      'company/establishment-card',
    ),
    resolveCompanyAssetUrl(
      input.tradeLicenseFile,
      input.existing.tradeLicenseUrl,
      'company/trade-license',
    ),
    resolveCompanyAssetUrl(input.logoFile, input.existing.logoUrl, 'company/logo'),
    resolveCompanyAssetUrl(input.coverFile, input.existing.coverUrl, 'company/cover'),
  ]);

  return { establishmentCardUrl, tradeLicenseUrl, logoUrl, coverUrl };
}
