import type { User } from '@prisma/client';
import type { UserProfile } from '@rateq/types';
import { UserRole } from '@rateq/types';
import { AdminPermissionsService } from '../../auth/services/admin-permissions.service';

const adminPermissionsService = new AdminPermissionsService();

export type SafeUser = Omit<User, 'passwordHash'>;

export function toSafeUser(user: User): SafeUser {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

export function toUserProfile(
  user: User & {
    profile?: { fullName: string; phone?: string; city: string; country: string } | null;
    ownedCompanies?: Array<{ id: string }> | null;
  },
): UserProfile {
  return {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    adminPermissions: adminPermissionsService.toPermissions(user),
    isVerified: user.isVerified,
    isActive: user.isActive,
    isProfileComplete: Boolean(
      user.profile || (user.ownedCompanies && user.ownedCompanies.length > 0),
    ),
    reviewCount: user.reviewCount,
    displayName: user.displayName,
    fullName: user.profile?.fullName ?? null,
    phone: user.profile?.phone?.trim() || user.phone?.trim() || null,
    city: user.profile?.city ?? null,
    country: user.profile?.country ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
