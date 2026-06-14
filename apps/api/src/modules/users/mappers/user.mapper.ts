import type { User } from '@prisma/client';
import type { UserProfile } from '@rateq/types';
import { UserRole } from '@rateq/types';

export type SafeUser = Omit<User, 'passwordHash'>;

export function toSafeUser(user: User): SafeUser {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

export function toUserProfile(
  user: User & { profile?: { fullName: string; city: string; country: string } | null },
): UserProfile {
  return {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    isVerified: user.isVerified,
    isActive: user.isActive,
    reviewCount: user.reviewCount,
    displayName: user.displayName,
    fullName: user.profile?.fullName ?? null,
    city: user.profile?.city ?? null,
    country: user.profile?.country ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
