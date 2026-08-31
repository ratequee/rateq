import type { CompanyMapLocation } from '@/lib/company-location';
import { isValidMapLocation } from '@/lib/company-location';
import { isValidQatarPhone } from '@/lib/qatar-phone';
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

export function isProfileFileWithinLimit(size: number | null | undefined): boolean {
  return !size || size <= MAX_PROFILE_FILE_BYTES;
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
  crNumber?: string;
  validationDate?: string;
  registrationDocFile?: string;
  establishmentCardFile?: string;
  tradeLicenseFile?: string;
  logoFile?: string;
  coverFile?: string;
  acceptedLegal?: string;
};

export function validateDisplayName(
  name: string,
  messages: { required: string; invalid: string; min: string; max: string },
): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return messages.required;
  if (trimmed.length < 2) return messages.min;
  if (trimmed.length > 50) return messages.max;
  if (!/^[\p{L}\p{M}\s'.-]+$/u.test(trimmed)) return messages.invalid;
  return undefined;
}

export function validateReviewerProfileFields(
  fields: {
    fullName: string;
    phone: string;
    city: string;
    country: string;
    bio: string;
    hasAvatar: boolean;
    phoneVerified?: boolean;
  },
  messages: {
    name: { required: string; invalid: string; min: string; max: string };
    phone: { required: string; invalid: string };
    location: { required: string };
    bio: { max: string };
    avatar: { required: string };
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
  if (fields.bio.trim().length > 500) errors.bio = messages.bio.max;
  if (!fields.hasAvatar) errors.avatar = messages.avatar.required;

  return errors;
}

export function validateCompanyProfileFields(
  fields: {
    companyName: string;
    companyAddress: string;
    companyLocation: CompanyMapLocation | null;
    companyPhone: string;
    categoryIds: string[];
    crNumber: string;
    validationDate: string;
    city: string;
    country: string;
    hasRegistrationDoc: boolean;
    hasEstablishmentCard: boolean;
    hasTradeLicense: boolean;
    hasLogo: boolean;
    hasCover: boolean;
    companyPhoneVerified?: boolean;
    acceptedLegal?: boolean;
  },
  messages: {
    required: string;
    fileTooLarge: string;
    companyName: { required?: string; invalid?: string; min: string; max: string };
    crNumber: { invalid: string };
    phone: { required: string; invalid: string };
    phoneVerification: { required: string };
    locationRequired: string;
    legalRequired: string;
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

  if (!fields.hasRegistrationDoc) errors.registrationDocFile = messages.required;
  if (!fields.hasEstablishmentCard) errors.establishmentCardFile = messages.required;
  if (!fields.hasTradeLicense) errors.tradeLicenseFile = messages.required;
  if (!fields.hasLogo) errors.logoFile = messages.required;
  if (!fields.hasCover) errors.coverFile = messages.required;
  if (!fields.acceptedLegal) errors.acceptedLegal = messages.legalRequired;

  return errors;
}

export const COMPANY_STEP1_KEYS = new Set([
  'companyName',
  'companyAddress',
  'companyLocation',
  'companyPhone',
  'companyPhoneVerification',
  'categoryId',
]);

export function hasValidationErrors(errors: object): boolean {
  return Object.keys(errors).length > 0;
}

export function validateReviewerSettingsFields(
  fields: {
    fullName: string;
    city: string;
    country: string;
    bio: string;
    avatarUri: string | null;
    hasExistingAvatar: boolean;
    newAvatarSize?: number;
  },
  messages: {
    name: { required: string; invalid: string; min: string; max: string };
    location: { required: string };
    bio: { max: string };
    avatar: { required: string; fileTooLarge: string };
  },
): Pick<ReviewerProfileErrors, 'fullName' | 'city' | 'country' | 'bio' | 'avatar'> {
  const errors: Pick<ReviewerProfileErrors, 'fullName' | 'city' | 'country' | 'bio' | 'avatar'> =
    {};

  const nameError = validateDisplayName(fields.fullName, messages.name);
  if (nameError) errors.fullName = nameError;

  if (!fields.city.trim()) errors.city = messages.location.required;
  if (!fields.country.trim()) errors.country = messages.location.required;
  if (fields.bio.trim().length > 500) errors.bio = messages.bio.max;

  const hasAvatar = Boolean(fields.avatarUri) || fields.hasExistingAvatar;
  if (!hasAvatar) {
    errors.avatar = messages.avatar.required;
  } else if (fields.newAvatarSize && !isProfileFileWithinLimit(fields.newAvatarSize)) {
    errors.avatar = messages.avatar.fileTooLarge;
  }

  return errors;
}

export function validateCompanySettingsFields(
  fields: {
    companyName: string;
    companyAddress: string;
    companyLocation: CompanyMapLocation | null;
    categoryIds: string[];
    city: string;
    country: string;
  },
  messages: {
    required: string;
    companyName: { min: string; max: string };
    locationRequired: string;
  },
): Pick<CompanyProfileErrors, 'companyName' | 'companyAddress' | 'companyLocation' | 'categoryId'> {
  const errors: Pick<
    CompanyProfileErrors,
    'companyName' | 'companyAddress' | 'companyLocation' | 'categoryId'
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

  if (
    !isValidMapLocation(fields.companyLocation) ||
    !fields.city.trim() ||
    !fields.country.trim()
  ) {
    errors.companyLocation = messages.locationRequired;
  }

  return errors;
}
