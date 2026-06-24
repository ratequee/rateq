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
  CreateCategoryInput,
  CreateCategoryServiceInput,
  MessageResponse,
} from '@rateq/types';
import { slugify, withSlugSuffix } from '@rateq/utils';
import { CategoriesRepository } from './repositories/categories.repository';
import { CategoryServicesRepository } from './repositories/category-services.repository';
import { toCategoryPublic } from './mappers/category.mapper';
import { toCategoryServicePublic } from './mappers/category-service.mapper';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly categoryServicesRepository: CategoryServicesRepository,
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
    const category = await this.categoriesRepository.create({ nameEn, nameAr, slug });
    return toCategoryPublic(category);
  }

  async remove(id: string): Promise<MessageResponse> {
    const category = await this.categoriesRepository.findById(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.categoriesRepository.delete(id);
    return { message: 'Category deleted successfully' };
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

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name);

    if (!base) {
      throw new BadRequestException('Category name cannot produce a valid URL slug');
    }

    let attempt = 0;
    let candidate = base;

    while (await this.categoriesRepository.slugExists(candidate)) {
      attempt += 1;
      candidate = withSlugSuffix(base, attempt);

      if (attempt > 100) {
        throw new ConflictException('Unable to generate a unique category slug');
      }
    }

    return candidate;
  }
}
