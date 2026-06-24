import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  BlogLocale,
  BlogPostAdmin,
  BlogPostPublic,
  CreateBlogPostInput,
  MessageResponse,
  PaginatedBlogPostsAdminResponse,
  PaginatedBlogPostsResponse,
} from '@rateq/types';
import { slugify } from '@rateq/utils';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import type { CreateBlogPostDto, UpdateBlogPostDto } from './dto/blog-post.dto';
import { toBlogPostAdmin, toBlogPostPublic, toPrismaStatus } from './mappers/blog.mapper';
import { BlogRepository } from './repositories/blog.repository';

@Injectable()
export class BlogService {
  constructor(private readonly blogRepository: BlogRepository) {}

  async listPublic(
    locale: BlogLocale,
    page: number,
    limit: number,
  ): Promise<PaginatedBlogPostsResponse> {
    const [posts, total] = await Promise.all([
      this.blogRepository.findPublishedByLocale(locale, page, limit),
      this.blogRepository.countPublishedByLocale(locale),
    ]);

    const data = posts
      .map((post) => toBlogPostPublic(post, locale))
      .filter((post): post is BlogPostPublic => post !== null);

    return {
      data,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getBySlug(locale: BlogLocale, slug: string): Promise<BlogPostPublic> {
    const post = await this.blogRepository.findPublishedBySlug(locale, slug);

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    const mapped = toBlogPostPublic(post, locale);

    if (!mapped) {
      throw new NotFoundException('Blog post not found');
    }

    return mapped;
  }

  async listAdmin(
    status: 'draft' | 'published' | undefined,
    page: number,
    limit: number,
  ): Promise<PaginatedBlogPostsAdminResponse> {
    const prismaStatus = status ? toPrismaStatus(status) : undefined;
    const [posts, total] = await Promise.all([
      this.blogRepository.findManyAdmin(prismaStatus, page, limit),
      this.blogRepository.countAdmin(prismaStatus),
    ]);

    return {
      data: posts.map(toBlogPostAdmin),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getAdmin(id: string): Promise<BlogPostAdmin> {
    const post = await this.blogRepository.findById(id);

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    return toBlogPostAdmin(post);
  }

  async create(dto: CreateBlogPostDto): Promise<BlogPostAdmin> {
    const translations = await this.normalizeTranslations(dto.translations);
    const status = dto.status ?? 'draft';
    const publishedAt = this.resolvePublishedAt(status, dto.publishedAt);

    const post = await this.blogRepository.create({
      status: toPrismaStatus(status),
      coverUrl: dto.coverUrl?.trim() || null,
      publishedAt,
      translations: {
        create: translations,
      },
    });

    return toBlogPostAdmin(post);
  }

  async update(id: string, dto: UpdateBlogPostDto): Promise<BlogPostAdmin> {
    const existing = await this.blogRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Blog post not found');
    }

    const nextStatus = dto.status ?? (existing.status.toLowerCase() as 'draft' | 'published');
    const publishedAt =
      dto.publishedAt !== undefined
        ? this.resolvePublishedAt(nextStatus, dto.publishedAt ?? undefined)
        : nextStatus === 'published' && !existing.publishedAt
          ? new Date()
          : existing.publishedAt;

    let post = await this.blogRepository.update(id, {
      ...(dto.status !== undefined && { status: toPrismaStatus(dto.status) }),
      ...(dto.coverUrl !== undefined && { coverUrl: dto.coverUrl?.trim() || null }),
      publishedAt,
    });

    if (dto.translations) {
      const translations = await this.normalizeTranslations(dto.translations, id);
      post = (await this.blogRepository.replaceTranslations(
        id,
        translations.map((translation) => ({ ...translation, postId: id })),
      ))!;
    }

    return toBlogPostAdmin(post);
  }

  async remove(id: string): Promise<MessageResponse> {
    const existing = await this.blogRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Blog post not found');
    }

    await this.blogRepository.delete(id);

    return { message: 'Blog post deleted successfully' };
  }

  private async normalizeTranslations(
    translations: CreateBlogPostInput['translations'],
    excludePostId?: string,
  ) {
    const locales = new Set<BlogLocale>();
    const normalized = [];

    for (const translation of translations) {
      if (locales.has(translation.locale)) {
        throw new BadRequestException(`Duplicate translation for locale "${translation.locale}"`);
      }
      locales.add(translation.locale);

      const title = translation.title.trim();
      const slug = slugify(translation.slug?.trim() || title);

      if (!slug) {
        throw new BadRequestException(`Unable to generate slug for locale "${translation.locale}"`);
      }

      const conflict = await this.blogRepository.findTranslationByLocaleAndSlug(
        translation.locale,
        slug,
        excludePostId,
      );

      if (conflict) {
        throw new ConflictException(
          `Slug "${slug}" is already used for locale "${translation.locale}"`,
        );
      }

      normalized.push({
        locale: translation.locale,
        title,
        slug,
        excerpt: translation.excerpt?.trim() || null,
        content: translation.content.trim(),
        metaTitle: translation.metaTitle?.trim() || null,
        metaDescription: translation.metaDescription?.trim() || null,
      });
    }

    return normalized;
  }

  private resolvePublishedAt(
    status: 'draft' | 'published',
    publishedAt?: string | null,
  ): Date | null {
    if (status !== 'published') {
      return null;
    }

    if (publishedAt) {
      const parsed = new Date(publishedAt);
      if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestException('Invalid publishedAt date');
      }
      return parsed;
    }

    return new Date();
  }
}
