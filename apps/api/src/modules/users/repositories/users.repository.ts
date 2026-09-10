import { Injectable } from '@nestjs/common';
import type { Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { paginationSkip } from '../../../common/utils/pagination.util';

export interface ListUsersFilters {
  role?: UserRole;
  excludeAdmins?: boolean;
  /** When true, only users who own at least one company. When false, exclude company owners. */
  ownsCompany?: boolean;
  isVerified?: boolean;
  search?: string;
  page: number;
  limit: number;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<
    | (User & {
        profile?: { fullName: string; phone: string; city: string; country: string } | null;
        ownedCompanies?: Array<{ id: string }>;
      })
    | null
  > {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: { select: { fullName: true, phone: true, city: true, country: true } },
        ownedCompanies: { select: { id: true }, take: 1 },
      },
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  countAdmins(): Promise<number> {
    return this.prisma.user.count({ where: { role: 'ADMIN' } });
  }

  countTeamManagers(): Promise<number> {
    return this.prisma.user.count({
      where: { role: 'ADMIN', adminPermissions: { has: 'TEAM' } },
    });
  }

  findMany(filters: ListUsersFilters): Promise<User[]> {
    const where = this.buildWhereClause(filters);

    return this.prisma.user.findMany({
      where,
      skip: paginationSkip(filters.page, filters.limit),
      take: filters.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        profile: { select: { fullName: true, phone: true, city: true, country: true } },
        ownedCompanies: { select: { id: true }, take: 1 },
      },
    });
  }

  count(filters: Omit<ListUsersFilters, 'page' | 'limit'>): Promise<number> {
    const where = this.buildWhereClause({ ...filters, page: 1, limit: 1 });
    return this.prisma.user.count({ where });
  }

  updateById(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  updatePassword(id: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  deleteById(id: string): Promise<User> {
    return this.prisma.user.delete({ where: { id } });
  }

  revokeAllSessions(userId: string): Promise<void> {
    return this.prisma.refreshToken.deleteMany({ where: { userId } }).then(() => undefined);
  }

  private buildWhereClause(filters: ListUsersFilters): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    if (filters.role) {
      where.role = filters.role;
    } else if (filters.excludeAdmins) {
      where.role = { not: 'ADMIN' };
    }

    if (filters.ownsCompany === true) {
      where.ownedCompanies = { some: {} };
    } else if (filters.ownsCompany === false) {
      where.ownedCompanies = { none: {} };
    }

    if (filters.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    if (filters.search) {
      where.email = {
        contains: filters.search.toLowerCase(),
        mode: 'insensitive',
      };
    }

    return where;
  }
}
