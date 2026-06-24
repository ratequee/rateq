import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CompanyCatalogItemPublic,
  CompanyCatalogType,
  CreateCompanyCatalogItemInput,
  UpdateCompanyCatalogItemInput,
} from '@rateq/types';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { CompanyCatalogType as PrismaCatalogType } from '@prisma/client';

function toPublic(item: {
  id: string;
  type: PrismaCatalogType;
  nameEn: string;
  nameAr: string;
  sortOrder: number;
  isActive: boolean;
}): CompanyCatalogItemPublic {
  return {
    id: item.id,
    type: item.type.toLowerCase() as CompanyCatalogType,
    nameEn: item.nameEn,
    nameAr: item.nameAr,
    sortOrder: item.sortOrder,
    isActive: item.isActive,
  };
}

@Injectable()
export class CompanyCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(type?: CompanyCatalogType): Promise<CompanyCatalogItemPublic[]> {
    const items = await this.prisma.companyCatalogItem.findMany({
      where: {
        isActive: true,
        ...(type ? { type: type.toUpperCase() as PrismaCatalogType } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
    });

    return items.map(toPublic);
  }

  async listAdmin(type?: CompanyCatalogType): Promise<CompanyCatalogItemPublic[]> {
    const items = await this.prisma.companyCatalogItem.findMany({
      where: type ? { type: type.toUpperCase() as PrismaCatalogType } : undefined,
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { nameEn: 'asc' }],
    });

    return items.map(toPublic);
  }

  async create(input: CreateCompanyCatalogItemInput): Promise<CompanyCatalogItemPublic> {
    const item = await this.prisma.companyCatalogItem.create({
      data: {
        type: input.type.toUpperCase() as PrismaCatalogType,
        nameEn: input.nameEn.trim(),
        nameAr: input.nameAr.trim(),
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true,
      },
    });

    return toPublic(item);
  }

  async update(
    id: string,
    input: UpdateCompanyCatalogItemInput,
  ): Promise<CompanyCatalogItemPublic> {
    const existing = await this.prisma.companyCatalogItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Catalog item not found');

    const item = await this.prisma.companyCatalogItem.update({
      where: { id },
      data: {
        ...(input.nameEn !== undefined && { nameEn: input.nameEn.trim() }),
        ...(input.nameAr !== undefined && { nameAr: input.nameAr.trim() }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });

    return toPublic(item);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.companyCatalogItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Catalog item not found');
    await this.prisma.companyCatalogItem.delete({ where: { id } });
  }

  async resolveLabels(
    ids: string[],
    locale: 'en' | 'ar' = 'en',
  ): Promise<Array<{ id: string; label: string }>> {
    if (!ids.length) return [];

    const items = await this.prisma.companyCatalogItem.findMany({
      where: { id: { in: ids }, isActive: true },
    });

    const itemMap = new Map(items.map((item) => [item.id, item]));

    return ids
      .map((id) => {
        const item = itemMap.get(id);
        if (!item) return null;
        return { id, label: locale === 'ar' ? item.nameAr : item.nameEn };
      })
      .filter((entry): entry is { id: string; label: string } => entry !== null);
  }

  async assertIdsExist(ids: string[], type: CompanyCatalogType): Promise<void> {
    if (!ids.length) return;

    const count = await this.prisma.companyCatalogItem.count({
      where: {
        id: { in: ids },
        type: type.toUpperCase() as PrismaCatalogType,
        isActive: true,
      },
    });

    if (count !== ids.length) {
      throw new NotFoundException(`One or more ${type} selections are invalid`);
    }
  }
}
