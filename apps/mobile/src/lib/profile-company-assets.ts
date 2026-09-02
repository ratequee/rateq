import { uploadUserFile } from '@/lib/firebase/storage';

export type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
};

export type CompanyAssetKey =
  | 'registration'
  | 'establishmentCard'
  | 'tradeLicense'
  | 'logo'
  | 'cover';

export interface CompanyExistingAssets {
  registrationDocUrl: string | null;
  establishmentCardUrl: string | null;
  tradeLicenseUrl: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
}

const UPLOAD_FOLDERS: Record<CompanyAssetKey, string> = {
  registration: 'company/registration',
  establishmentCard: 'company/establishment-card',
  tradeLicense: 'company/trade-license',
  logo: 'company/logo',
  cover: 'company/cover',
};

export async function resolveCompanyAssetUrl(
  newFile: PickedFile | null,
  existingUrl: string | null,
  assetKey: CompanyAssetKey,
): Promise<string | null> {
  if (newFile) {
    return uploadUserFile(UPLOAD_FOLDERS[assetKey], newFile.uri, newFile.name, newFile.mimeType);
  }
  if (existingUrl?.trim()) {
    return existingUrl;
  }
  return null;
}

export async function uploadChangedCompanyAssets(input: {
  registrationDocFile: PickedFile | null;
  establishmentCardFile: PickedFile | null;
  tradeLicenseFile: PickedFile | null;
  logoFile: PickedFile | null;
  coverFile: PickedFile | null;
}): Promise<Partial<CompanyExistingAssets>> {
  const tasks: Array<Promise<[keyof CompanyExistingAssets, string]>> = [];

  if (input.registrationDocFile) {
    tasks.push(
      resolveCompanyAssetUrl(input.registrationDocFile, null, 'registration').then((url) => {
        if (!url) throw new Error('registration');
        return ['registrationDocUrl', url] as const;
      }),
    );
  }
  if (input.establishmentCardFile) {
    tasks.push(
      resolveCompanyAssetUrl(input.establishmentCardFile, null, 'establishmentCard').then((url) => {
        if (!url) throw new Error('establishment');
        return ['establishmentCardUrl', url] as const;
      }),
    );
  }
  if (input.tradeLicenseFile) {
    tasks.push(
      resolveCompanyAssetUrl(input.tradeLicenseFile, null, 'tradeLicense').then((url) => {
        if (!url) throw new Error('tradeLicense');
        return ['tradeLicenseUrl', url] as const;
      }),
    );
  }
  if (input.logoFile) {
    tasks.push(
      resolveCompanyAssetUrl(input.logoFile, null, 'logo').then((url) => {
        if (!url) throw new Error('logo');
        return ['logoUrl', url] as const;
      }),
    );
  }
  if (input.coverFile) {
    tasks.push(
      resolveCompanyAssetUrl(input.coverFile, null, 'cover').then((url) => {
        if (!url) throw new Error('cover');
        return ['coverUrl', url] as const;
      }),
    );
  }

  const uploaded = await Promise.all(tasks);
  return Object.fromEntries(uploaded) as Partial<CompanyExistingAssets>;
}

export async function resolveCompanyDocumentUrls(input: {
  registrationDocFile: PickedFile | null;
  establishmentCardFile: PickedFile | null;
  tradeLicenseFile: PickedFile | null;
  logoFile: PickedFile | null;
  coverFile: PickedFile | null;
  existing: CompanyExistingAssets;
}): Promise<CompanyExistingAssets> {
  const [registrationDocUrl, establishmentCardUrl, tradeLicenseUrl, logoUrl, coverUrl] =
    await Promise.all([
      resolveCompanyAssetUrl(
        input.registrationDocFile,
        input.existing.registrationDocUrl,
        'registration',
      ),
      resolveCompanyAssetUrl(
        input.establishmentCardFile,
        input.existing.establishmentCardUrl,
        'establishmentCard',
      ),
      resolveCompanyAssetUrl(
        input.tradeLicenseFile,
        input.existing.tradeLicenseUrl,
        'tradeLicense',
      ),
      resolveCompanyAssetUrl(input.logoFile, input.existing.logoUrl, 'logo'),
      resolveCompanyAssetUrl(input.coverFile, input.existing.coverUrl, 'cover'),
    ]);

  return {
    registrationDocUrl,
    establishmentCardUrl,
    tradeLicenseUrl,
    logoUrl,
    coverUrl,
  };
}
