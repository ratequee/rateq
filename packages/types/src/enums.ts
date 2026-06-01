export enum UserRole {
  USER = 'USER',
  COMPANY = 'COMPANY',
  ADMIN = 'ADMIN',
}

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ModerationAction {
  AUTO_APPROVED = 'AUTO_APPROVED',
  QUEUED = 'QUEUED',
  MANUAL_APPROVED = 'MANUAL_APPROVED',
  MANUAL_REJECTED = 'MANUAL_REJECTED',
  FLAGGED = 'FLAGGED',
}

export enum Locale {
  EN = 'en',
  AR = 'ar',
}
