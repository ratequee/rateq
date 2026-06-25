import { Injectable } from '@nestjs/common';
import type { AdminActivityAction, AdminActivityEntityType } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { paginationSkip } from '../../../common/utils/pagination.util';

@Injectable()
export class AdminActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    adminId: string;
    entityType: AdminActivityEntityType;
    entityId: string;
    entityLabel: string;
    action: AdminActivityAction;
  }) {
    return this.prisma.adminActivityLog.create({ data });
  }

  findMany(input: { page: number; limit: number }) {
    return this.prisma.adminActivityLog.findMany({
      skip: paginationSkip(input.page, input.limit),
      take: input.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { id: true, email: true, displayName: true } },
      },
    });
  }

  count(): Promise<number> {
    return this.prisma.adminActivityLog.count();
  }
}
