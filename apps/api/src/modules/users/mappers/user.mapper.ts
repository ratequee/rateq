import type { User } from '@prisma/client';
import type { UserProfile } from '@rateq/types';
import { UserRole } from '@rateq/types';

export type SafeUser = Omit<User, 'passwordHash'>;

export function toSafeUser(user: User): SafeUser {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

export function toUserProfile(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    isVerified: user.isVerified,
    reviewCount: user.reviewCount,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
