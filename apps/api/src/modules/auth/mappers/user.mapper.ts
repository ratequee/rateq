import type { User } from '@prisma/client';
import type { AuthenticatedUser } from '@rateq/types';
import { UserRole } from '@rateq/types';

export function toAuthenticatedUser(user: User): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    isVerified: user.isVerified,
  };
}
