import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CategoriesListResponse,
  CategoryPublic,
  CreateCategoryInput,
  MessageResponse,
} from '@rateq/types';
import { slugify, withSlugSuffix } from '@rateq/utils';
import { CategoriesRepository } from './repositories/categories.repository';
import { toCategoryPublic } from './mappers/category.mapper';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

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
    const name = input.name.trim();

    if (!name) {
      throw new BadRequestException('Category name is required');
    }

    const slug = await this.generateUniqueSlug(name);
    const category = await this.categoriesRepository.create({ name, slug });
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
