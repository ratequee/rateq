import { Injectable } from '@nestjs/common';
import type { BlogPostStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

const translationInclude = {
  translations: {
    orderBy: { locale: 'asc' as const },
  },
} satisfies Prisma.BlogPostInclude;

@Injectable()
export class BlogRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPublishedByLocale(locale: string, page: number, limit: number) {
    return this.prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        translations: { some: { locale } },
      },
      include: {
        translations: {
          where: { locale },
        },
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  countPublishedByLocale(locale: string) {
    return this.prisma.blogPost.count({
      where: {
        status: 'PUBLISHED',
        translations: { some: { locale } },
      },
    });
  }

  findPublishedBySlug(locale: string, slug: string) {
    return this.prisma.blogPost.findFirst({
      where: {
        status: 'PUBLISHED',
        translations: { some: { locale, slug } },
      },
      include: {
        translations: {
          where: { locale },
        },
      },
    });
  }

  findManyAdmin(status: BlogPostStatus | undefined, page: number, limit: number) {
    return this.prisma.blogPost.findMany({
      where: status ? { status } : undefined,
      include: translationInclude,
      orderBy: [{ updatedAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  countAdmin(status: BlogPostStatus | undefined) {
    return this.prisma.blogPost.count({
      where: status ? { status } : undefined,
    });
  }

  findById(id: string) {
    return this.prisma.blogPost.findUnique({
      where: { id },
      include: translationInclude,
    });
  }

  findTranslationByLocaleAndSlug(locale: string, slug: string, excludePostId?: string) {
    return this.prisma.blogPostTranslation.findFirst({
      where: {
        locale,
        slug,
        ...(excludePostId ? { postId: { not: excludePostId } } : {}),
      },
    });
  }

  create(data: Prisma.BlogPostCreateInput) {
    return this.prisma.blogPost.create({
      data,
      include: translationInclude,
    });
  }

  update(id: string, data: Prisma.BlogPostUpdateInput) {
    return this.prisma.blogPost.update({
      where: { id },
      data,
      include: translationInclude,
    });
  }

  replaceTranslations(postId: string, translations: Prisma.BlogPostTranslationCreateManyInput[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.blogPostTranslation.deleteMany({ where: { postId } });
      if (translations.length > 0) {
        await tx.blogPostTranslation.createMany({ data: translations });
      }
      return tx.blogPost.findUnique({
        where: { id: postId },
        include: translationInclude,
      });
    });
  }

  delete(id: string) {
    return this.prisma.blogPost.delete({ where: { id } });
  }
}
