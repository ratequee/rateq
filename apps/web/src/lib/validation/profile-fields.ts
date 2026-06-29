import type { CompanyMapLocation } from '@/lib/company-location';
import { isValidMapLocation } from '@/lib/company-location';
import { isValidQatarPhone } from '@/lib/qatar-phone';
import { validateDisplayName } from '@/lib/validation/auth-fields';
import type { CategoryPublic } from '@rateq/types';

const COMPANY_NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}\s&.\-'()]*[\p{L}\p{N})]?$/u;
const CR_NUMBER_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}\-/]*[\p{L}\p{N}]?$/u;

export const MAX_PROFILE_FILE_BYTES = 10 * 1024 * 1024;

export function sanitizeCompanyName(value: string): string {
  return value
    .replace(/[^\p{L}\p{N}\s&.\-'()]/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/^\s+/, '');
}

export function sanitizeCrNumber(value: string): string {
  return value.replace(/[^\p{L}\p{N}\-/]/gu, '');
}

export function isProfileFileWithinLimit(file: File | null): boolean {
  return !file || file.size <= MAX_PROFILE_FILE_BYTES;
}

export type ReviewerProfileErrors = {
  fullName?: string;
  phone?: string;
  phoneVerification?: string;
  city?: string;
  country?: string;
  bio?: string;
  avatar?: string;
};

export type CompanyProfileErrors = {
  companyName?: string;
  companyAddress?: string;
  companyLocation?: string;
  companyPhone?: string;
  companyPhoneVerification?: string;
  categoryId?: string;
  categoryIds?: string;
  subcategoryIds?: string;
  crNumber?: string;
  validationDate?: string;
  city?: string;
  country?: string;
  registrationDocFile?: string;
  establishmentCardFile?: string;
  tradeLicenseFile?: string;
  logoFile?: string;
  coverFile?: string;
};

export function filterSubcategoryIdsForCategories(
  categories: CategoryPublic[],
  categoryIds: string[],
  subcategoryIds: string[],
): string[] {
  const validIds = new Set(
    categories
      .filter((category) => categoryIds.includes(category.id))
      .flatMap((category) => (category.subcategories ?? []).map((item) => item.id)),
  );
  return subcategoryIds.filter((id) => validIds.has(id));
}

export function validateSubcategorySelection(
  categories: CategoryPublic[],
  categoryIds: string[],
  subcategoryIds: string[],
  message: string,
): string | undefined {
  for (const categoryId of categoryIds) {
    const category = categories.find((item) => item.id === categoryId);
    const subcategories = category?.subcategories ?? [];
    if (subcategories.length === 0) continue;
    const hasSelection = subcategories.some((item) => subcategoryIds.includes(item.id));
    if (!hasSelection) return message;
  }
  return undefined;
}

export function validateReviewerProfileFields(
  fields: {
    fullName: string;
    phone: string;
    city: string;
    country: string;
    bio: string;
    avatar: File | null;
    hasExistingAvatar: boolean;
    phoneVerified?: boolean;
  },
  messages: {
    name: { required: string; invalid: string; min: string; max: string };
    phone: { required: string; invalid: string };
    location: { required: string };
    bio: { max: string };
    avatar: { required: string; fileTooLarge: string };
    phoneVerification: { required: string };
  },
): ReviewerProfileErrors {
  const errors: ReviewerProfileErrors = {};

  const nameError = validateDisplayName(fields.fullName, messages.name);
  if (nameError) errors.fullName = nameError;

  if (!fields.phoneVerified) {
    const phone = fields.phone.trim();
    if (!phone) {
      errors.phone = messages.phone.required;
    } else if (!isValidQatarPhone(phone)) {
      errors.phone = messages.phone.invalid;
    } else {
      errors.phoneVerification = messages.phoneVerification.required;
    }
  }

  if (!fields.city.trim()) errors.city = messages.location.required;
  if (!fields.country.trim()) errors.country = messages.location.required;

  if (fields.bio.trim().length > 500) {
    errors.bio = messages.bio.max;
  }

  if (!fields.avatar && !fields.hasExistingAvatar) {
    errors.avatar = messages.avatar.required;
  } else if (fields.avatar && !isProfileFileWithinLimit(fields.avatar)) {
    errors.avatar = messages.avatar.fileTooLarge;
  }

  return errors;
}

export function validateReviewerSettingsFields(
  fields: {
    fullName: string;
    city: string;
    country: string;
    bio: string;
    avatar: File | null;
    hasExistingAvatar: boolean;
  },
  messages: {
    name: { required: string; invalid: string; min: string; max: string };
    location: { required: string };
    bio: { max: string };
    avatar: { required: string; fileTooLarge: string };
  },
): Omit<ReviewerProfileErrors, 'phone' | 'phoneVerification'> {
  const errors: Omit<ReviewerProfileErrors, 'phone' | 'phoneVerification'> = {};

  const nameError = validateDisplayName(fields.fullName, messages.name);
  if (nameError) errors.fullName = nameError;

  if (!fields.city.trim()) errors.city = messages.location.required;
  if (!fields.country.trim()) errors.country = messages.location.required;

  if (fields.bio.trim().length > 500) {
    errors.bio = messages.bio.max;
  }

  if (!fields.avatar && !fields.hasExistingAvatar) {
    errors.avatar = messages.avatar.required;
  } else if (fields.avatar && !isProfileFileWithinLimit(fields.avatar)) {
    errors.avatar = messages.avatar.fileTooLarge;
  }

  return errors;
}

export function validateCompanyProfileFields(
  fields: {
    companyName: string;
    companyAddress: string;
    companyLocation: CompanyMapLocation | null;
    companyPhone: string;
    categoryIds: string[];
    subcategoryIds?: string[];
    categories?: CategoryPublic[];
    crNumber: string;
    validationDate: string;
    city: string;
    country: string;
    registrationDocFile: File | null;
    establishmentCardFile: File | null;
    tradeLicenseFile: File | null;
    logoFile: File | null;
    coverFile: File | null;
    hasExistingRegistrationDoc: boolean;
    hasExistingEstablishmentCard: boolean;
    hasExistingTradeLicense: boolean;
    hasExistingLogo: boolean;
    hasExistingCover: boolean;
    companyPhoneVerified?: boolean;
  },
  messages: {
    required: string;
    fileTooLarge: string;
    companyName: { required?: string; invalid?: string; min: string; max: string };
    crNumber: { invalid: string };
    phone: { required: string; invalid: string };
    phoneVerification: { required: string };
    locationRequired: string;
    subcategoryRequired?: string;
  },
): CompanyProfileErrors {
  const errors: CompanyProfileErrors = {};

  const name = fields.companyName.trim();
  if (!name) {
    errors.companyName = messages.companyName.required ?? messages.required;
  } else if (name.length < 2) {
    errors.companyName = messages.companyName.min;
  } else if (name.length > 200) {
    errors.companyName = messages.companyName.max;
  } else if (!COMPANY_NAME_PATTERN.test(name)) {
    errors.companyName = messages.companyName.invalid ?? messages.companyName.min;
  }

  if (!fields.companyAddress.trim()) errors.companyAddress = messages.required;

  const phone = fields.companyPhone.trim();
  if (!phone) {
    errors.companyPhone = messages.phone.required;
  } else if (!isValidQatarPhone(phone)) {
    errors.companyPhone = messages.phone.invalid;
  } else if (!fields.companyPhoneVerified) {
    errors.companyPhoneVerification = messages.phoneVerification.required;
  }

  if (fields.categoryIds.length === 0) errors.categoryId = messages.required;

  if (fields.categories?.length && messages.subcategoryRequired) {
    const subcategoryError = validateSubcategorySelection(
      fields.categories,
      fields.categoryIds,
      fields.subcategoryIds ?? [],
      messages.subcategoryRequired,
    );
    if (subcategoryError) errors.subcategoryIds = subcategoryError;
  }

  if (!fields.crNumber.trim()) {
    errors.crNumber = messages.required;
  } else if (fields.crNumber.trim().length < 3 || !CR_NUMBER_PATTERN.test(fields.crNumber.trim())) {
    errors.crNumber = messages.crNumber.invalid;
  }

  if (!fields.validationDate) errors.validationDate = messages.required;
  if (
    !isValidMapLocation(fields.companyLocation) ||
    !fields.city.trim() ||
    !fields.country.trim()
  ) {
    errors.companyLocation = messages.locationRequired;
  }

  if (!fields.registrationDocFile && !fields.hasExistingRegistrationDoc) {
    errors.registrationDocFile = messages.required;
  } else if (fields.registrationDocFile && !isProfileFileWithinLimit(fields.registrationDocFile)) {
    errors.registrationDocFile = messages.fileTooLarge;
  }

  if (!fields.establishmentCardFile && !fields.hasExistingEstablishmentCard) {
    errors.establishmentCardFile = messages.required;
  } else if (
    fields.establishmentCardFile &&
    !isProfileFileWithinLimit(fields.establishmentCardFile)
  ) {
    errors.establishmentCardFile = messages.fileTooLarge;
  }

  if (!fields.tradeLicenseFile && !fields.hasExistingTradeLicense) {
    errors.tradeLicenseFile = messages.required;
  } else if (fields.tradeLicenseFile && !isProfileFileWithinLimit(fields.tradeLicenseFile)) {
    errors.tradeLicenseFile = messages.fileTooLarge;
  }

  if (!fields.logoFile && !fields.hasExistingLogo) {
    errors.logoFile = messages.required;
  } else if (fields.logoFile && !isProfileFileWithinLimit(fields.logoFile)) {
    errors.logoFile = messages.fileTooLarge;
  }

  if (!fields.coverFile && !fields.hasExistingCover) {
    errors.coverFile = messages.required;
  } else if (fields.coverFile && !isProfileFileWithinLimit(fields.coverFile)) {
    errors.coverFile = messages.fileTooLarge;
  }

  return errors;
}

export function validateCompanySettingsFields(
  fields: {
    companyName: string;
    companyAddress: string;
    companyLocation: CompanyMapLocation | null;
    categoryIds: string[];
    subcategoryIds?: string[];
    categories?: CategoryPublic[];
    city: string;
    country: string;
  },
  messages: {
    required: string;
    companyName: { min: string; max: string };
    locationRequired: string;
    subcategoryRequired?: string;
  },
): Pick<
  CompanyProfileErrors,
  'companyName' | 'companyAddress' | 'companyLocation' | 'categoryId' | 'subcategoryIds'
> {
  const errors: Pick<
    CompanyProfileErrors,
    'companyName' | 'companyAddress' | 'companyLocation' | 'categoryId' | 'subcategoryIds'
  > = {};

  const name = fields.companyName.trim();
  if (!name) {
    errors.companyName = messages.required;
  } else if (name.length < 2) {
    errors.companyName = messages.companyName.min;
  } else if (name.length > 200) {
    errors.companyName = messages.companyName.max;
  }

  if (!fields.companyAddress.trim()) errors.companyAddress = messages.required;
  if (fields.categoryIds.length === 0) errors.categoryId = messages.required;

  if (fields.categories?.length && messages.subcategoryRequired) {
    const subcategoryError = validateSubcategorySelection(
      fields.categories,
      fields.categoryIds,
      fields.subcategoryIds ?? [],
      messages.subcategoryRequired,
    );
    if (subcategoryError) errors.subcategoryIds = subcategoryError;
  }

  if (
    !isValidMapLocation(fields.companyLocation) ||
    !fields.city.trim() ||
    !fields.country.trim()
  ) {
    errors.companyLocation = messages.locationRequired;
  }

  return errors;
}

export function hasValidationErrors(errors: object): boolean {
  return Object.keys(errors).length > 0;
}
