import { Injectable } from '@nestjs/common';
import type { CategorySubcategory, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class CategorySubcategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByCategoryId(categoryId: string): Promise<CategorySubcategory[]> {
    return this.prisma.categorySubcategory.findMany({
      where: { categoryId },
      orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
    });
  }

  findByIds(ids: string[]): Promise<CategorySubcategory[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.prisma.categorySubcategory.findMany({ where: { id: { in: ids } } });
  }

  findById(id: string): Promise<CategorySubcategory | null> {
    return this.prisma.categorySubcategory.findUnique({ where: { id } });
  }

  slugExists(categoryId: string, slug: string, excludeId?: string): Promise<boolean> {
    return this.prisma.categorySubcategory
      .findFirst({
        where: {
          categoryId,
          slug,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      })
      .then((item) => item !== null);
  }

  countByCategoryId(categoryId: string): Promise<number> {
    return this.prisma.categorySubcategory.count({ where: { categoryId } });
  }

  create(data: Prisma.CategorySubcategoryCreateInput): Promise<CategorySubcategory> {
    return this.prisma.categorySubcategory.create({ data });
  }

  delete(id: string): Promise<CategorySubcategory> {
    return this.prisma.categorySubcategory.delete({ where: { id } });
  }
}
