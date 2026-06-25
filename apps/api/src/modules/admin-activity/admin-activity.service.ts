import { Injectable } from '@nestjs/common';
import type {
  AdminActivityAction as ApiAdminActivityAction,
  AdminActivityEntityType as ApiAdminActivityEntityType,
  AdminActivityLog,
  PaginatedAdminActivityResponse,
} from '@rateq/types';
import { AdminActivityAction, AdminActivityEntityType } from '@rateq/types';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { AdminActivityRepository } from './repositories/admin-activity.repository';

@Injectable()
export class AdminActivityService {
  constructor(private readonly repository: AdminActivityRepository) {}

  async log(input: {
    adminId: string;
    entityType: ApiAdminActivityEntityType;
    entityId: string;
    entityLabel: string;
    action: ApiAdminActivityAction;
  }): Promise<void> {
    await this.repository.create({
      adminId: input.adminId,
      entityType: input.entityType as AdminActivityEntityType,
      entityId: input.entityId,
      entityLabel: input.entityLabel.trim() || input.entityId,
      action: input.action as AdminActivityAction,
    });
  }

  async list(page: number, limit: number): Promise<PaginatedAdminActivityResponse> {
    const [rows, total] = await Promise.all([
      this.repository.findMany({ page, limit }),
      this.repository.count(),
    ]);

    return {
      data: rows.map(
        (row): AdminActivityLog => ({
          id: row.id,
          adminId: row.admin.id,
          adminEmail: row.admin.email,
          adminDisplayName: row.admin.displayName,
          entityType: row.entityType as ApiAdminActivityEntityType,
          entityId: row.entityId,
          entityLabel: row.entityLabel,
          action: row.action as ApiAdminActivityAction,
          createdAt: row.createdAt.toISOString(),
        }),
      ),
      meta: buildPaginationMeta(page, limit, total),
    };
  }
}
