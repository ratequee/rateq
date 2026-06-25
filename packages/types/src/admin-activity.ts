export enum AdminActivityEntityType {
  COMPANY_VERIFICATION = 'COMPANY_VERIFICATION',
  COMPANY_PROFILE_CHANGE = 'COMPANY_PROFILE_CHANGE',
  REVIEW = 'REVIEW',
}

export enum AdminActivityAction {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVISION_REQUESTED = 'REVISION_REQUESTED',
  RESOLVED = 'RESOLVED',
  DELETED = 'DELETED',
}

export interface AdminActivityLog {
  id: string;
  adminId: string;
  adminEmail: string;
  adminDisplayName: string | null;
  entityType: AdminActivityEntityType;
  entityId: string;
  entityLabel: string;
  action: AdminActivityAction;
  createdAt: string;
}

export type PaginatedAdminActivityResponse =
  import('./pagination').PaginatedResponse<AdminActivityLog>;
