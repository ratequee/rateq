import { Injectable } from '@nestjs/common';
import type { Category, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<(Category & { _count: { companies: number } })[]> {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { companies: true } } },
    });
  }

  findById(id: string): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.prisma.category.findUnique({
      where: { slug },
      include: { _count: { select: { companies: true } } },
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

  delete(id: string): Promise<Category> {
    return this.prisma.category.delete({ where: { id } });
  }
}
