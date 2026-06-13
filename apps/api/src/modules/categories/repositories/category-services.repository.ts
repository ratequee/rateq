import { Injectable } from '@nestjs/common';
import type { CategoryService, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class CategoryServicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByCategoryId(categoryId: string): Promise<CategoryService[]> {
    return this.prisma.categoryService.findMany({
      where: { categoryId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  findById(id: string): Promise<CategoryService | null> {
    return this.prisma.categoryService.findUnique({ where: { id } });
  }

  slugExists(categoryId: string, slug: string, excludeId?: string): Promise<boolean> {
    return this.prisma.categoryService
      .findFirst({
        where: {
          categoryId,
          slug,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      })
      .then((service) => service !== null);
  }

  create(data: Prisma.CategoryServiceCreateInput): Promise<CategoryService> {
    return this.prisma.categoryService.create({ data });
  }

  delete(id: string): Promise<CategoryService> {
    return this.prisma.categoryService.delete({ where: { id } });
  }

  countByCategoryId(categoryId: string): Promise<number> {
    return this.prisma.categoryService.count({ where: { categoryId } });
  }
}
