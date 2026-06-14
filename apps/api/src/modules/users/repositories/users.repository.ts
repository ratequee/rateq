import { Injectable } from '@nestjs/common';
import type { Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { paginationSkip } from '../../../common/utils/pagination.util';

export interface ListUsersFilters {
  role?: UserRole;
  isVerified?: boolean;
  search?: string;
  page: number;
  limit: number;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(
    id: string,
  ): Promise<
    (User & { profile?: { fullName: string; city: string; country: string } | null }) | null
  > {
    return this.prisma.user.findUnique({
      where: { id },
      include: { profile: { select: { fullName: true, city: true, country: true } } },
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  countAdmins(): Promise<number> {
    return this.prisma.user.count({ where: { role: 'ADMIN' } });
  }

  findMany(filters: ListUsersFilters): Promise<User[]> {
    const where = this.buildWhereClause(filters);

    return this.prisma.user.findMany({
      where,
      skip: paginationSkip(filters.page, filters.limit),
      take: filters.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        profile: { select: { fullName: true, city: true, country: true } },
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
