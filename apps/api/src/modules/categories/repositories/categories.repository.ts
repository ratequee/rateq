import { Injectable } from '@nestjs/common';
import type { Category, CategorySubcategory, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

type CategoryWithRelations = Category & {
  _count: { companies: number };
  services: import('@prisma/client').CategoryService[];
  subcategories: CategorySubcategory[];
};

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<CategoryWithRelations[]> {
    return this.prisma.category.findMany({
      orderBy: { nameEn: 'asc' },
      include: {
        _count: { select: { companies: true } },
        services: { orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
        subcategories: { orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }] },
      },
    });
  }

  findById(id: string): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: { id } });
  }

  findByIds(ids: string[]): Promise<Category[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.prisma.category.findMany({ where: { id: { in: ids } } });
  }

  findBySlug(slug: string) {
    return this.prisma.category.findUnique({
      where: { slug },
      include: {
        _count: { select: { companies: true } },
        services: { orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
        subcategories: { orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }] },
      },
    });
  }

  slugExists(slug: string, excludeId?: string): Promise<boolean> {
    return this.prisma.category
      .findFirst({
        where: {
          slug,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      })
      .then((category) => category !== null);
  }

  create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return this.prisma.category.create({ data });
  }

  update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return this.prisma.category.update({ where: { id }, data });
  }

  delete(id: string): Promise<Category> {
    return this.prisma.category.delete({ where: { id } });
  }
}
