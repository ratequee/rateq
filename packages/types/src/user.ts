import type { UserRole } from './enums';
import type { PaginatedResponse } from './pagination';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  reviewCount: number;
  displayName?: string | null;
  fullName?: string | null;
  city?: string | null;
  country?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PaginatedUsersResponse = PaginatedResponse<UserProfile>;

export interface AdminUpdateUserInput {
  role?: UserRole;
  isVerified?: boolean;
  isActive?: boolean;
}
