import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CategoriesListResponse,
  CategoryPublic,
  CategoryServicePublic,
  CategorySubcategoryPublic,
  CompanyCategoryLabel,
  CreateCategoryInput,
  CreateCategoryServiceInput,
  CreateCategorySubcategoryInput,
  MessageResponse,
  UpdateCategoryInput,
  UpdateCategorySubcategoryInput,
} from '@rateq/types';
import { Prisma } from '@prisma/client';
import { slugify, withSlugSuffix } from '@rateq/utils';
import { CategoriesRepository } from './repositories/categories.repository';
import { CategoryServicesRepository } from './repositories/category-services.repository';
import { CategorySubcategoriesRepository } from './repositories/category-subcategories.repository';
import { toCategoryPublic } from './mappers/category.mapper';
import { toCategoryServicePublic } from './mappers/category-service.mapper';
import { toCategorySubcategoryPublic } from './mappers/category-subcategory.mapper';
import { PrismaService } from '../../infrastructure/database/prisma.service';

function parseCompanyIdList(value: unknown): string[] {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly categoryServicesRepository: CategoryServicesRepository,
    private readonly categorySubcategoriesRepository: CategorySubcategoriesRepository,
    private readonly prisma: PrismaService,
  ) {}

  async listPublic(): Promise<CategoriesListResponse> {
    const categories = await this.categoriesRepository.findAll();
    return categories.map(toCategoryPublic);
  }

  async getBySlug(slug: string): Promise<CategoryPublic> {
    const category = await this.categoriesRepository.findBySlug(slug);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return toCategoryPublic(category);
  }

  async create(input: CreateCategoryInput): Promise<CategoryPublic> {
    const nameEn = input.nameEn.trim();
    const nameAr = input.nameAr.trim();

    if (!nameEn || !nameAr) {
      throw new BadRequestException('Category names in English and Arabic are required');
    }

    const slug = await this.generateUniqueSlug(nameEn);
    const sortOrder = await this.categoriesRepository.count();
    const category = await this.categoriesRepository.create({
      nameEn,
      nameAr,
      slug,
      sortOrder,
      ...(input.iconUrl !== undefined ? { iconUrl: input.iconUrl?.trim() || null } : {}),
    });
    return toCategoryPublic(category);
  }

  async update(id: string, input: UpdateCategoryInput): Promise<CategoryPublic> {
    const category = await this.categoriesRepository.findById(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const nameEn = input.nameEn?.trim();
    const nameAr = input.nameAr?.trim();

    if (nameEn !== undefined && !nameEn) {
      throw new BadRequestException('English category name cannot be empty');
    }
    if (nameAr !== undefined && !nameAr) {
      throw new BadRequestException('Arabic category name cannot be empty');
    }

    const slug =
      nameEn && nameEn !== category.nameEn ? await this.generateUniqueSlug(nameEn, id) : undefined;

    try {
      const updated = await this.categoriesRepository.update(id, {
        ...(nameEn !== undefined && { nameEn, ...(slug ? { slug } : {}) }),
        ...(nameAr !== undefined && { nameAr }),
        ...(input.iconUrl !== undefined && { iconUrl: input.iconUrl?.trim() || null }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      });

      return toCategoryPublic(updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Category not found');
        }
        if (error.code === 'P2002') {
          throw new ConflictException('A category with this name already exists');
        }
      }
      throw error;
    }
  }

  async resolveSubcategoryLabelMap(
    subcategoryIds: string[],
  ): Promise<Map<string, { en: string; ar: string | null }>> {
    const normalized = [...new Set(subcategoryIds.map((id) => id.trim()).filter(Boolean))];
    if (normalized.length === 0) return new Map();

    const subcategories = await this.categorySubcategoriesRepository.findByIds(normalized);
    return new Map(subcategories.map((item) => [item.id, { en: item.nameEn, ar: item.nameAr }]));
  }

  async resolveSubcategoryLabels(
    subcategoryIds: string[],
    locale: 'en' | 'ar' = 'en',
  ): Promise<CompanyCategoryLabel[]> {
    if (subcategoryIds.length === 0) return [];

    const subcategories = await this.categorySubcategoriesRepository.findByIds(subcategoryIds);
    const byId = new Map(subcategories.map((item) => [item.id, item]));

    return subcategoryIds
      .filter((id) => byId.has(id))
      .map((id) => {
        const item = byId.get(id)!;
        return {
          id,
          label: locale === 'ar' ? item.nameAr : item.nameEn,
          labelAr: item.nameAr,
        };
      });
  }

  async assertSubcategoriesForCategories(
    categoryIds: string[],
    subcategoryIds: string[],
  ): Promise<void> {
    if (categoryIds.length === 0) return;

    const subcategories = await this.categorySubcategoriesRepository.findByIds(subcategoryIds);
    const byCategory = new Map<string, number>();

    for (const subcategory of subcategories) {
      byCategory.set(subcategory.categoryId, (byCategory.get(subcategory.categoryId) ?? 0) + 1);
    }

    for (const categoryId of categoryIds) {
      const available = await this.categorySubcategoriesRepository.countByCategoryId(categoryId);
      if (available === 0) continue;
      const selected = byCategory.get(categoryId) ?? 0;
      if (selected === 0) {
        throw new BadRequestException('Select at least one subcategory for each selected category');
      }
    }
  }

  async addSubcategory(
    categoryId: string,
    input: CreateCategorySubcategoryInput,
  ): Promise<CategorySubcategoryPublic> {
    await this.assertExists(categoryId);

    const nameEn = input.nameEn.trim();
    const nameAr = input.nameAr.trim();
    if (!nameEn || !nameAr) {
      throw new BadRequestException('Subcategory names in English and Arabic are required');
    }

    const slug = await this.generateUniqueSubcategorySlug(categoryId, nameEn);
    const sortOrder = await this.categorySubcategoriesRepository.countByCategoryId(categoryId);

    const subcategory = await this.categorySubcategoriesRepository.create({
      nameEn,
      nameAr,
      slug,
      sortOrder,
      category: { connect: { id: categoryId } },
    });

    return toCategorySubcategoryPublic(subcategory);
  }

  async updateSubcategory(
    categoryId: string,
    subcategoryId: string,
    input: UpdateCategorySubcategoryInput,
  ): Promise<CategorySubcategoryPublic> {
    await this.assertExists(categoryId);
    const subcategory = await this.categorySubcategoriesRepository.findById(subcategoryId);
    if (!subcategory || subcategory.categoryId !== categoryId) {
      throw new NotFoundException('Subcategory not found for this category');
    }

    const nameEn = input.nameEn?.trim();
    const nameAr = input.nameAr?.trim();

    if (nameEn !== undefined && !nameEn) {
      throw new BadRequestException('English subcategory name cannot be empty');
    }
    if (nameAr !== undefined && !nameAr) {
      throw new BadRequestException('Arabic subcategory name cannot be empty');
    }

    const slug =
      nameEn && nameEn !== subcategory.nameEn
        ? await this.generateUniqueSubcategorySlug(categoryId, nameEn, subcategoryId)
        : undefined;

    const updated = await this.categorySubcategoriesRepository.update(subcategoryId, {
      ...(nameEn !== undefined && { nameEn, ...(slug ? { slug } : {}) }),
      ...(nameAr !== undefined && { nameAr }),
    });

    return toCategorySubcategoryPublic(updated);
  }

  async removeSubcategory(categoryId: string, subcategoryId: string): Promise<MessageResponse> {
    await this.assertExists(categoryId);
    const subcategory = await this.categorySubcategoriesRepository.findById(subcategoryId);
    if (!subcategory || subcategory.categoryId !== categoryId) {
      throw new NotFoundException('Subcategory not found for this category');
    }

    await this.prisma.$transaction(async (tx) => {
      const companies = await tx.company.findMany({
        where: { subcategoryIds: { array_contains: [subcategoryId] } },
        select: { id: true, subcategoryIds: true },
      });

      for (const company of companies) {
        const nextSubcategoryIds = parseCompanyIdList(company.subcategoryIds).filter(
          (id) => id !== subcategoryId,
        );
        await tx.company.update({
          where: { id: company.id },
          data: { subcategoryIds: nextSubcategoryIds },
        });
      }

      await tx.categorySubcategory.delete({ where: { id: subcategoryId } });
    });

    return { message: 'Subcategory deleted successfully' };
  }

  private async generateUniqueSubcategorySlug(
    categoryId: string,
    name: string,
    excludeId?: string,
  ): Promise<string> {
    const base = slugify(name);
    if (!base) {
      throw new BadRequestException('Subcategory name cannot produce a valid URL slug');
    }

    let attempt = 0;
    let candidate = base;
    while (
      await this.categorySubcategoriesRepository.slugExists(categoryId, candidate, excludeId)
    ) {
      attempt += 1;
      candidate = withSlugSuffix(base, attempt);
      if (attempt > 100) {
        throw new ConflictException('Unable to generate a unique subcategory slug');
      }
    }

    return candidate;
  }

  async resolveLabels(
    categoryIds: string[],
    locale: 'en' | 'ar' = 'en',
  ): Promise<CompanyCategoryLabel[]> {
    if (categoryIds.length === 0) return [];

    const categories = await this.categoriesRepository.findByIds(categoryIds);
    const byId = new Map(categories.map((category) => [category.id, category]));

    return categoryIds
      .filter((id) => byId.has(id))
      .map((id) => {
        const category = byId.get(id)!;
        return {
          id,
          label: locale === 'ar' ? category.nameAr : category.nameEn,
          labelAr: category.nameAr,
        };
      });
  }

  async remove(id: string): Promise<MessageResponse> {
    const category = await this.categoriesRepository.findById(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const subcategoryIds = (await this.categorySubcategoriesRepository.findByCategoryId(id)).map(
      (item) => item.id,
    );

    await this.prisma.$transaction(async (tx) => {
      await this.scrubCompaniesAfterCategoryRemoval(tx, id, subcategoryIds);
      await tx.category.delete({ where: { id } });
    });

    return { message: 'Category deleted successfully' };
  }

  private async scrubCompaniesAfterCategoryRemoval(
    tx: Prisma.TransactionClient,
    categoryId: string,
    removedSubcategoryIds: string[],
  ): Promise<void> {
    const removedSubSet = new Set(removedSubcategoryIds);
    const companies = await tx.company.findMany({
      where: {
        OR: [
          { categoryId },
          { categoryIds: { array_contains: [categoryId] } },
          ...(removedSubcategoryIds.length > 0
            ? removedSubcategoryIds.map((subcategoryId) => ({
                subcategoryIds: { array_contains: [subcategoryId] },
              }))
            : []),
        ],
      },
      select: {
        id: true,
        categoryId: true,
        categoryIds: true,
        subcategoryIds: true,
      },
    });

    for (const company of companies) {
      const nextCategoryIds = parseCompanyIdList(company.categoryIds).filter(
        (id) => id !== categoryId,
      );
      const nextSubcategoryIds = parseCompanyIdList(company.subcategoryIds).filter(
        (id) => !removedSubSet.has(id),
      );
      const nextPrimary =
        company.categoryId === categoryId ? (nextCategoryIds[0] ?? null) : company.categoryId;

      await tx.company.update({
        where: { id: company.id },
        data: {
          categoryId: nextPrimary,
          categoryIds: nextCategoryIds,
          subcategoryIds: nextSubcategoryIds,
        },
      });
    }
  }

  async assertExists(id: string): Promise<void> {
    const category = await this.categoriesRepository.findById(id);

    if (!category) {
      throw new BadRequestException('Selected category does not exist');
    }
  }

  async listServices(categoryId: string): Promise<CategoryServicePublic[]> {
    await this.assertExists(categoryId);
    const services = await this.categoryServicesRepository.findByCategoryId(categoryId);
    return services.map(toCategoryServicePublic);
  }

  async addService(
    categoryId: string,
    input: CreateCategoryServiceInput,
  ): Promise<CategoryServicePublic> {
    await this.assertExists(categoryId);

    const name = input.name.trim();
    if (!name) {
      throw new BadRequestException('Service name is required');
    }

    const slug = await this.generateUniqueServiceSlug(categoryId, name);
    const sortOrder = await this.categoryServicesRepository.countByCategoryId(categoryId);

    const service = await this.categoryServicesRepository.create({
      name,
      slug,
      sortOrder,
      category: { connect: { id: categoryId } },
    });

    return toCategoryServicePublic(service);
  }

  async removeService(categoryId: string, serviceId: string): Promise<MessageResponse> {
    await this.assertExists(categoryId);

    const service = await this.categoryServicesRepository.findById(serviceId);

    if (!service || service.categoryId !== categoryId) {
      throw new NotFoundException('Service not found for this category');
    }

    await this.categoryServicesRepository.delete(serviceId);
    return { message: 'Service deleted successfully' };
  }

  private async generateUniqueServiceSlug(categoryId: string, name: string): Promise<string> {
    const base = slugify(name);

    if (!base) {
      throw new BadRequestException('Service name cannot produce a valid URL slug');
    }

    let attempt = 0;
    let candidate = base;

    while (await this.categoryServicesRepository.slugExists(categoryId, candidate)) {
      attempt += 1;
      candidate = withSlugSuffix(base, attempt);

      if (attempt > 100) {
        throw new ConflictException('Unable to generate a unique service slug');
      }
    }

    return candidate;
  }

  private async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    const base = slugify(name);

    if (!base) {
      throw new BadRequestException('Category name cannot produce a valid URL slug');
    }

    let attempt = 0;
    let candidate = base;

    while (await this.categoriesRepository.slugExists(candidate, excludeId)) {
      attempt += 1;
      candidate = withSlugSuffix(base, attempt);

      if (attempt > 100) {
        throw new ConflictException('Unable to generate a unique category slug');
      }
    }

    return candidate;
  }
}
