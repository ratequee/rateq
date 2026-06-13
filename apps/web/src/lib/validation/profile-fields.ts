import { validateDisplayName } from '@/lib/validation/auth-fields';

const PHONE_PATTERN = /^[+]?[\d\s()-]{6,30}$/;

export const MAX_PROFILE_FILE_BYTES = 10 * 1024 * 1024;

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
  companyPhone?: string;
  companyPhoneVerification?: string;
  categoryId?: string;
  crNumber?: string;
  validationDate?: string;
  city?: string;
  country?: string;
  establishmentCardFile?: string;
  tradeLicenseFile?: string;
  logoFile?: string;
  coverFile?: string;
};

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
    } else if (!PHONE_PATTERN.test(phone)) {
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

export function validateCompanyProfileFields(
  fields: {
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    categoryId: string;
    crNumber: string;
    validationDate: string;
    city: string;
    country: string;
    establishmentCardFile: File | null;
    tradeLicenseFile: File | null;
    logoFile: File | null;
    coverFile: File | null;
    hasExistingEstablishmentCard: boolean;
    hasExistingTradeLicense: boolean;
    hasExistingLogo: boolean;
    hasExistingCover: boolean;
    companyPhoneVerified?: boolean;
  },
  messages: {
    required: string;
    fileTooLarge: string;
    companyName: { min: string; max: string };
    crNumber: { invalid: string };
    phone: { required: string; invalid: string };
    phoneVerification: { required: string };
  },
): CompanyProfileErrors {
  const errors: CompanyProfileErrors = {};

  const name = fields.companyName.trim();
  if (!name) {
    errors.companyName = messages.required;
  } else if (name.length < 2) {
    errors.companyName = messages.companyName.min;
  } else if (name.length > 200) {
    errors.companyName = messages.companyName.max;
  }

  if (!fields.companyAddress.trim()) errors.companyAddress = messages.required;

  const phone = fields.companyPhone.trim();
  if (!phone) {
    errors.companyPhone = messages.phone.required;
  } else if (!PHONE_PATTERN.test(phone)) {
    errors.companyPhone = messages.phone.invalid;
  } else if (!fields.companyPhoneVerified) {
    errors.companyPhoneVerification = messages.phoneVerification.required;
  }

  if (!fields.categoryId.trim()) errors.categoryId = messages.required;

  if (!fields.crNumber.trim()) {
    errors.crNumber = messages.required;
  } else if (fields.crNumber.trim().length < 3) {
    errors.crNumber = messages.crNumber.invalid;
  }

  if (!fields.validationDate) errors.validationDate = messages.required;
  if (!fields.city.trim()) errors.city = messages.required;
  if (!fields.country.trim()) errors.country = messages.required;

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

export function hasValidationErrors(errors: object): boolean {
  return Object.keys(errors).length > 0;
}
