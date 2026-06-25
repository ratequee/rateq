import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminCompanyVerificationDetail,
  AuthenticatedUser,
  CompanyDashboard,
  CompanyDetail,
  CompanyPublic,
  CreateCompanyInput,
  MessageResponse,
  PaginatedCompaniesResponse,
  PaginatedAdminCompanyVerifications,
  UpdateCompanyInput,
  UpdateCompanyVerificationInput,
} from '@rateq/types';
import { UserRole } from '@rateq/types';
import { AdminActivityAction, AdminActivityEntityType } from '@rateq/types';
import { UserRole as PrismaUserRole, Prisma, ReviewStatus } from '@prisma/client';
import { slugify, withSlugSuffix } from '@rateq/utils';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { CompaniesRepository } from './repositories/companies.repository';
import { CategoriesService } from '../categories/categories.service';
import { PhoneOtpService } from '../phone-verification/phone-otp.service';
import { EmailService } from '../auth/services/email.service';
import { AdminActivityService } from '../admin-activity/admin-activity.service';
import { CompanyCatalogService } from './company-catalog.service';
import { toCompanyDetail, toCompanyPublic, parseCompanyIdList } from './mappers/company.mapper';
import { toReviewPublic } from '../reviews/mappers/review.mapper';
import {
  toAdminCompanyVerificationDetail,
  toAdminCompanyVerificationSummary,
} from './mappers/admin-company.mapper';
import type { CompanyVerificationStatus } from '@prisma/client';
import type { SearchCompaniesQueryDto } from './dto/search-companies-query.dto';

const RESERVED_SLUGS = new Set(['me', 'admin', 'search', 'status']);

@Injectable()
export class CompaniesService {
  constructor(
    private readonly companiesRepository: CompaniesRepository,
    private readonly prisma: PrismaService,
    private readonly categoriesService: CategoriesService,
    private readonly phoneOtpService: PhoneOtpService,
    private readonly emailService: EmailService,
    private readonly catalogService: CompanyCatalogService,
    private readonly adminActivity: AdminActivityService,
  ) {}

  async search(query: SearchCompaniesQueryDto): Promise<PaginatedCompaniesResponse> {
    const filters = {
      query: query.query,
      country: query.country,
      city: query.city,
      categoryId: query.categoryId,
      minRating: query.minRating,
      sort: query.sort,
      page: query.page,
      limit: query.limit,
    };

    const [companies, total] = await Promise.all([
      this.companiesRepository.findMany(filters),
      this.companiesRepository.count(filters),
    ]);

    return {
      data: companies.map((company) => toCompanyPublic(company)),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async getPublicProfile(slug: string): Promise<CompanyPublic> {
    const company = await this.companiesRepository.findBySlug(slug);

    if (!company || company.verificationStatus !== 'APPROVED') {
      throw new NotFoundException('Company not found');
    }

    if (company.owner && !company.owner.isActive) {
      throw new NotFoundException('Company not found');
    }

    const ratingDistribution = await this.companiesRepository.getApprovedRatingDistribution(
      company.id,
    );

    return this.mapCompanyPublic(company, { ratingDistribution });
  }

  private async getServiceRatingAggregates(
    companyId: string,
    serviceIds: string[],
    locale: 'en' | 'ar' = 'en',
  ): Promise<import('@rateq/types').CompanyServiceRatingAggregate[]> {
    if (!serviceIds.length) return [];

    const [groups, labels] = await Promise.all([
      this.prisma.reviewServiceRating.groupBy({
        by: ['companyCatalogItemId'],
        where: {
          companyCatalogItemId: { in: serviceIds },
          review: { companyId, status: ReviewStatus.APPROVED },
        },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      this.catalogService.resolveLabels(serviceIds, locale),
    ]);

    const groupMap = new Map(groups.map((group) => [group.companyCatalogItemId, group]));
    const labelMap = new Map(labels.map((label) => [label.id, label.label]));

    return serviceIds.map((catalogItemId) => {
      const group = groupMap.get(catalogItemId);
      return {
        catalogItemId,
        label: labelMap.get(catalogItemId) ?? 'Service',
        averageRating: group?._avg.rating ? Number(group._avg.rating) : 0,
        reviewCount: group?._count._all ?? 0,
      };
    });
  }

  private async mapCompanyPublic(
    company: NonNullable<Awaited<ReturnType<CompaniesRepository['findBySlug']>>>,
    extras?: { ratingDistribution?: import('@rateq/types').ReviewRatingDistribution },
  ) {
    const serviceIds = parseCompanyIdList(company.serviceIds);
    const activityIds = parseCompanyIdList(company.activityIds);
    const [serviceItems, activityItems, serviceRatingAggregates] = await Promise.all([
      this.catalogService.resolveLabels(serviceIds, 'en'),
      this.catalogService.resolveLabels(activityIds, 'en'),
      this.getServiceRatingAggregates(company.id, serviceIds),
    ]);

    return toCompanyPublic(company, {
      ...extras,
      serviceItems,
      activityItems,
      serviceRatingAggregates,
    });
  }

  private async mapCompanyDetail(
    company: NonNullable<Awaited<ReturnType<CompaniesRepository['findByOwnerId']>>>,
    extras?: { ratingDistribution?: import('@rateq/types').ReviewRatingDistribution },
  ) {
    const serviceIds = parseCompanyIdList(company.serviceIds);
    const activityIds = parseCompanyIdList(company.activityIds);
    const [serviceItems, activityItems] = await Promise.all([
      this.catalogService.resolveLabels(serviceIds, 'en'),
      this.catalogService.resolveLabels(activityIds, 'en'),
    ]);

    return toCompanyDetail(company, { ...extras, serviceItems, activityItems });
  }

  async register(user: AuthenticatedUser, input: CreateCompanyInput): Promise<CompanyDetail> {
    if (user.role === UserRole.ADMIN) {
      // Admin may register on behalf of testing flows without role change.
    } else if (user.role !== UserRole.USER && user.role !== UserRole.COMPANY) {
      throw new ForbiddenException('This account cannot register a company profile');
    }

    if (!user.isVerified) {
      throw new ForbiddenException('Verify your email before registering a company');
    }

    const existing = await this.companiesRepository.findByOwnerId(user.id);

    if (existing) {
      throw new ConflictException('You already have a registered company');
    }

    const reviewerProfile = await this.prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    if (reviewerProfile) {
      throw new ConflictException('A reviewer profile already exists for this account');
    }

    const slug = await this.generateUniqueSlug(input.name);
    await this.categoriesService.assertExists(input.categoryId);
    await this.phoneOtpService.assertPhoneVerified(user.id, input.phone, 'company');

    if (input.serviceIds?.length) {
      await this.catalogService.assertIdsExist(input.serviceIds, 'service');
    }
    if (input.activityIds?.length) {
      await this.catalogService.assertIdsExist(input.activityIds, 'activity');
    }

    await this.companiesRepository.create({
      name: input.name.trim(),
      nameAr: input.nameAr?.trim() ?? null,
      slug,
      email: user.email,
      phone: input.phone.trim(),
      description: input.descriptionEn?.trim() ?? input.description?.trim() ?? null,
      descriptionEn: input.descriptionEn?.trim() ?? input.description?.trim() ?? null,
      descriptionAr: input.descriptionAr?.trim() ?? null,
      logo: input.logo,
      coverUrl: input.coverUrl,
      address: input.address.trim(),
      latitude: input.latitude,
      longitude: input.longitude,
      crNumber: input.crNumber.trim(),
      validationDate: new Date(input.validationDate),
      registrationDocUrl: input.registrationDocUrl ?? null,
      establishmentCardUrl: input.establishmentCardUrl,
      tradeLicenseUrl: input.tradeLicenseUrl,
      verificationStatus: 'PENDING',
      country: input.country.trim(),
      city: input.city.trim(),
      serviceIds: input.serviceIds ?? [],
      activityIds: input.activityIds ?? [],
      yearsEstablished: input.yearsEstablished ?? null,
      publicProjectCount: input.publicProjectCount ?? null,
      privateProjectCount: input.privateProjectCount ?? null,
      category: { connect: { id: input.categoryId } },
      owner: { connect: { id: user.id } },
    });

    if (user.role === UserRole.USER) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { role: PrismaUserRole.COMPANY },
      });
    }

    await this.phoneOtpService.clearSession(user.id, 'company');

    const withRelations = await this.companiesRepository.findByOwnerId(user.id);
    return this.mapCompanyDetail(withRelations!);
  }

  async getMyCompany(userId: string): Promise<CompanyDetail> {
    const company = await this.companiesRepository.findByOwnerId(userId);

    if (!company) {
      throw new NotFoundException('No company profile found for this account');
    }

    const ratingDistribution = await this.companiesRepository.getApprovedRatingDistribution(
      company.id,
    );

    return this.mapCompanyDetail(company, { ratingDistribution });
  }

  async getDashboard(userId: string): Promise<CompanyDashboard> {
    const company = await this.companiesRepository.findByOwnerId(userId);

    if (!company) {
      throw new NotFoundException('No company profile found for this account');
    }

    const [reviewStats, dailyActivity, topReviewers, latestReviews, monthlyPageVisits] =
      await Promise.all([
        this.companiesRepository.getReviewStats(company.id),
        this.getCompanyDailyAnalytics(company.id),
        this.getCompanyTopReviewers(company.id),
        this.getCompanyLatestReviews(company.id),
        this.getMonthlyPageVisits(company.id),
      ]);

    return {
      company: await this.mapCompanyDetail(company),
      stats: {
        ...reviewStats,
        averageRating: Number(company.ratingAverage),
        monthlyPageVisits,
      },
      dailyActivity,
      topReviewers,
      latestReviews,
    };
  }

  async updateMyCompany(userId: string, input: UpdateCompanyInput): Promise<CompanyDetail> {
    const company = await this.companiesRepository.findByOwnerId(userId);

    if (!company) {
      throw new NotFoundException('No company profile found for this account');
    }

    const resubmitAfterRevision = company.verificationStatus === 'REVISION_REQUESTED';

    if (input.phone !== undefined) {
      await this.phoneOtpService.assertPhoneVerified(userId, input.phone, 'company');
    }

    if (company.verificationStatus === 'PENDING') {
      throw new ForbiddenException(
        'Your company profile is awaiting admin review and cannot be edited',
      );
    }

    if (company.verificationStatus === 'APPROVED') {
      const hasDocumentUpdate =
        input.logo !== undefined ||
        input.coverUrl !== undefined ||
        input.registrationDocUrl !== undefined ||
        input.establishmentCardUrl !== undefined ||
        input.tradeLicenseUrl !== undefined;

      if (hasDocumentUpdate) {
        throw new ForbiddenException(
          'Document uploads cannot be changed from the profile settings page',
        );
      }

      if (input.serviceIds?.length) {
        await this.catalogService.assertIdsExist(input.serviceIds, 'service');
      }
      if (input.activityIds?.length) {
        await this.catalogService.assertIdsExist(input.activityIds, 'activity');
      }

      const pendingChanges = this.mergePendingChanges(
        company.pendingProfileChanges as Record<string, unknown> | null,
        input,
      );

      await this.companiesRepository.update(company.id, {
        profileChangeStatus: 'PENDING',
        pendingProfileChanges: pendingChanges as Prisma.InputJsonValue,
      });

      const refreshed = await this.companiesRepository.findByOwnerId(userId);
      const ratingDistribution = await this.companiesRepository.getApprovedRatingDistribution(
        company.id,
      );
      return this.mapCompanyDetail(refreshed!, { ratingDistribution });
    }

    const updated = await this.applyUpdate(company.id, company.slug, input);

    if (resubmitAfterRevision) {
      if (input.phone !== undefined) {
        await this.phoneOtpService.clearSession(userId, 'company');
      }
      const reset = await this.companiesRepository.update(company.id, {
        verificationStatus: 'PENDING',
        revisionNotes: null,
      });
      const refreshed = await this.companiesRepository.findById(reset.id);
      const ratingDistribution = await this.companiesRepository.getApprovedRatingDistribution(
        reset.id,
      );
      return this.mapCompanyDetail(refreshed!, { ratingDistribution });
    }

    return updated;
  }

  async listAdminProfileChanges(): Promise<CompanyDetail[]> {
    const companies = await this.prisma.company.findMany({
      where: { profileChangeStatus: 'PENDING', verificationStatus: 'APPROVED' },
      include: {
        owner: { select: { id: true, email: true, isActive: true } },
        category: { select: { id: true, nameEn: true, nameAr: true, slug: true } },
        projects: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return Promise.all(companies.map((company) => this.mapCompanyDetail(company)));
  }

  async approveProfileChanges(companyId: string, adminId: string): Promise<CompanyDetail> {
    const company = await this.companiesRepository.findById(companyId);
    if (!company) throw new NotFoundException('Company not found');
    if (company.profileChangeStatus !== 'PENDING' || !company.pendingProfileChanges) {
      throw new BadRequestException('No pending profile changes for this company');
    }

    const pending = company.pendingProfileChanges as UpdateCompanyInput;
    await this.applyUpdate(company.id, company.slug, pending);

    await this.companiesRepository.update(companyId, {
      profileChangeStatus: 'NONE',
      pendingProfileChanges: Prisma.JsonNull,
    });

    await this.adminActivity.log({
      adminId,
      entityType: AdminActivityEntityType.COMPANY_PROFILE_CHANGE,
      entityId: companyId,
      entityLabel: company.name,
      action: AdminActivityAction.APPROVED,
    });

    const refreshed = await this.companiesRepository.findById(companyId);
    const ratingDistribution =
      await this.companiesRepository.getApprovedRatingDistribution(companyId);
    return this.mapCompanyDetail(refreshed!, { ratingDistribution });
  }

  async rejectProfileChanges(companyId: string, adminId: string): Promise<CompanyDetail> {
    const company = await this.companiesRepository.findById(companyId);
    if (!company) throw new NotFoundException('Company not found');
    if (company.profileChangeStatus !== 'PENDING') {
      throw new BadRequestException('No pending profile changes for this company');
    }

    await this.companiesRepository.update(companyId, {
      profileChangeStatus: 'NONE',
      pendingProfileChanges: Prisma.JsonNull,
    });

    await this.adminActivity.log({
      adminId,
      entityType: AdminActivityEntityType.COMPANY_PROFILE_CHANGE,
      entityId: companyId,
      entityLabel: company.name,
      action: AdminActivityAction.REJECTED,
    });

    const refreshed = await this.companiesRepository.findById(companyId);
    const ratingDistribution =
      await this.companiesRepository.getApprovedRatingDistribution(companyId);
    return this.mapCompanyDetail(refreshed!, { ratingDistribution });
  }

  private mergePendingChanges(
    existing: Record<string, unknown> | null,
    input: UpdateCompanyInput,
  ): UpdateCompanyInput {
    const base = (existing ?? {}) as UpdateCompanyInput;
    return { ...base, ...input };
  }

  async adminUpdate(companyId: string, input: UpdateCompanyInput): Promise<CompanyDetail> {
    const company = await this.companiesRepository.findById(companyId);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.applyUpdate(company.id, company.slug, input);
  }

  async listAdminVerifications(input: {
    status?: 'pending' | 'approved' | 'rejected' | 'revision_requested';
    page: number;
    limit: number;
  }): Promise<PaginatedAdminCompanyVerifications> {
    const prismaStatus = input.status
      ? (input.status.toUpperCase() as CompanyVerificationStatus)
      : undefined;

    const [companies, total] = await Promise.all([
      this.companiesRepository.findManyForAdminVerification({
        status: prismaStatus,
        page: input.page,
        limit: input.limit,
      }),
      this.companiesRepository.countForAdminVerification(prismaStatus),
    ]);

    return {
      data: companies.map(toAdminCompanyVerificationSummary),
      meta: buildPaginationMeta(input.page, input.limit, total),
    };
  }

  async getAdminVerificationDetail(companyId: string): Promise<AdminCompanyVerificationDetail> {
    const company = await this.companiesRepository.findByIdWithOwner(companyId);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return toAdminCompanyVerificationDetail(company);
  }

  async setAdminVerificationStatus(
    companyId: string,
    input: UpdateCompanyVerificationInput,
    adminId: string,
  ): Promise<AdminCompanyVerificationDetail> {
    const company = await this.companiesRepository.findByIdWithOwner(companyId);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const ownerEmail = company.owner?.email;
    const companyName = company.name;

    if (input.status === 'approved') {
      const updated = await this.companiesRepository.update(companyId, {
        verificationStatus: 'APPROVED',
        revisionNotes: null,
      });

      if (ownerEmail) {
        await this.emailService.sendCompanyVerificationApprovedEmail(ownerEmail, companyName);
      }

      await this.adminActivity.log({
        adminId,
        entityType: AdminActivityEntityType.COMPANY_VERIFICATION,
        entityId: companyId,
        entityLabel: companyName,
        action: AdminActivityAction.APPROVED,
      });

      const withOwner = await this.companiesRepository.findByIdWithOwner(updated.id);
      return toAdminCompanyVerificationDetail(withOwner!);
    }

    if (input.status === 'rejected') {
      if (ownerEmail) {
        await this.emailService.sendCompanyVerificationRejectedEmail(ownerEmail, companyName);
      }

      await this.adminActivity.log({
        adminId,
        entityType: AdminActivityEntityType.COMPANY_VERIFICATION,
        entityId: companyId,
        entityLabel: companyName,
        action: AdminActivityAction.REJECTED,
      });

      const ownerId = company.ownerId;
      await this.companiesRepository.delete(companyId);

      if (ownerId) {
        await this.prisma.user.update({
          where: { id: ownerId },
          data: { role: PrismaUserRole.USER },
        });
      }

      return {
        ...toAdminCompanyVerificationDetail(company),
        verificationStatus: 'rejected',
        revisionNotes: null,
      };
    }

    const revisionNotes = input.revisionNotes?.trim();
    if (!revisionNotes) {
      throw new BadRequestException('Revision notes are required when sending for review');
    }

    const updated = await this.companiesRepository.update(companyId, {
      verificationStatus: 'REVISION_REQUESTED',
      revisionNotes,
    });

    if (ownerEmail) {
      await this.emailService.sendCompanyRevisionRequestedEmail(
        ownerEmail,
        companyName,
        revisionNotes,
      );
    }

    await this.adminActivity.log({
      adminId,
      entityType: AdminActivityEntityType.COMPANY_VERIFICATION,
      entityId: companyId,
      entityLabel: companyName,
      action: AdminActivityAction.REVISION_REQUESTED,
    });

    const withOwner = await this.companiesRepository.findByIdWithOwner(updated.id);
    return toAdminCompanyVerificationDetail(withOwner!);
  }

  async adminDelete(companyId: string): Promise<MessageResponse> {
    const company = await this.companiesRepository.findById(companyId);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    await this.companiesRepository.delete(companyId);

    return { message: 'Company deleted successfully' };
  }

  private async applyUpdate(
    companyId: string,
    currentSlug: string,
    input: UpdateCompanyInput,
  ): Promise<CompanyDetail> {
    let slug = currentSlug;

    if (input.name) {
      slug = await this.generateUniqueSlug(input.name.trim(), companyId);
    }

    if (input.categoryId !== undefined) {
      await this.categoriesService.assertExists(input.categoryId);
    }

    await this.companiesRepository.update(companyId, {
      ...(input.name !== undefined && { name: input.name.trim(), slug }),
      ...(input.nameAr !== undefined && { nameAr: input.nameAr?.trim() ?? null }),
      ...(input.description !== undefined && {
        description: input.description?.trim() ?? null,
      }),
      ...(input.descriptionEn !== undefined && {
        descriptionEn: input.descriptionEn?.trim() ?? null,
        description: input.descriptionEn?.trim() ?? null,
      }),
      ...(input.descriptionAr !== undefined && {
        descriptionAr: input.descriptionAr?.trim() ?? null,
      }),
      ...(input.websiteUrl !== undefined && {
        websiteUrl: input.websiteUrl?.trim() ?? null,
      }),
      ...(input.services !== undefined && {
        services: input.services
          .map((service) => service.trim())
          .filter(Boolean)
          .slice(0, 20),
      }),
      ...(input.serviceIds !== undefined && { serviceIds: input.serviceIds }),
      ...(input.activityIds !== undefined && { activityIds: input.activityIds }),
      ...(input.yearsEstablished !== undefined && {
        yearsEstablished: input.yearsEstablished,
      }),
      ...(input.publicProjectCount !== undefined && {
        publicProjectCount: input.publicProjectCount,
      }),
      ...(input.privateProjectCount !== undefined && {
        privateProjectCount: input.privateProjectCount,
      }),
      ...(input.logo !== undefined && { logo: input.logo }),
      ...(input.coverUrl !== undefined && { coverUrl: input.coverUrl }),
      ...(input.address !== undefined && { address: input.address.trim() }),
      ...(input.latitude !== undefined && { latitude: input.latitude }),
      ...(input.longitude !== undefined && { longitude: input.longitude }),
      ...(input.phone !== undefined && { phone: input.phone.trim() }),
      ...(input.categoryId !== undefined && {
        category: { connect: { id: input.categoryId } },
      }),
      ...(input.crNumber !== undefined && { crNumber: input.crNumber.trim() }),
      ...(input.validationDate !== undefined && {
        validationDate: new Date(input.validationDate),
      }),
      ...(input.registrationDocUrl !== undefined && {
        registrationDocUrl: input.registrationDocUrl,
      }),
      ...(input.establishmentCardUrl !== undefined && {
        establishmentCardUrl: input.establishmentCardUrl,
      }),
      ...(input.tradeLicenseUrl !== undefined && {
        tradeLicenseUrl: input.tradeLicenseUrl,
      }),
      ...(input.country !== undefined && { country: input.country.trim() }),
      ...(input.city !== undefined && { city: input.city.trim() }),
    });

    if (input.projects !== undefined) {
      await this.companiesRepository.replaceProjects(companyId, input.projects);
    }

    const refreshed = await this.companiesRepository.findById(companyId);
    const ratingDistribution =
      await this.companiesRepository.getApprovedRatingDistribution(companyId);
    return this.mapCompanyDetail(refreshed!, { ratingDistribution });
  }

  private async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    const base = slugify(name);

    if (!base) {
      throw new BadRequestException('Company name cannot produce a valid URL slug');
    }

    if (RESERVED_SLUGS.has(base)) {
      throw new BadRequestException('Company name produces a reserved slug');
    }

    let attempt = 0;
    let candidate = base;

    while (await this.companiesRepository.slugExists(candidate, excludeId)) {
      attempt += 1;
      candidate = withSlugSuffix(base, attempt);

      if (attempt > 100) {
        throw new ConflictException('Unable to generate a unique company slug');
      }
    }

    return candidate;
  }

  async recordPageView(slug: string, visitorId: string, userId?: string): Promise<MessageResponse> {
    const company = await this.companiesRepository.findBySlug(slug);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);

    const existingView = userId
      ? await this.prisma.companyPageView.findFirst({
          where: {
            companyId: company.id,
            userId,
            viewedAt: { gte: dayStart },
          },
          select: { id: true },
        })
      : await this.prisma.companyPageView.findFirst({
          where: {
            companyId: company.id,
            visitorId,
            viewedAt: { gte: dayStart },
          },
          select: { id: true },
        });

    if (existingView) {
      return { message: 'Page view already recorded today' };
    }

    await this.prisma.companyPageView.create({
      data: {
        companyId: company.id,
        visitorId,
        userId: userId ?? null,
      },
    });

    return { message: 'Page view recorded' };
  }

  private async getCompanyDailyAnalytics(companyId: string) {
    const rangeStart = new Date();
    rangeStart.setHours(0, 0, 0, 0);
    rangeStart.setDate(rangeStart.getDate() - 6);

    const [reviews, pageViews] = await Promise.all([
      this.prisma.review.findMany({
        where: { companyId, createdAt: { gte: rangeStart } },
        select: { createdAt: true },
      }),
      this.prisma.companyPageView.findMany({
        where: { companyId, viewedAt: { gte: rangeStart } },
        select: { viewedAt: true },
      }),
    ]);

    const buckets = Array.from({ length: 7 }, (_, index) => {
      const dayStart = new Date(rangeStart);
      dayStart.setDate(dayStart.getDate() + index);

      return {
        date: dayStart.toISOString().slice(0, 10),
        reviewCount: 0,
        pageVisits: 0,
      };
    });

    for (const review of reviews) {
      const dayIndex = Math.floor(
        (review.createdAt.getTime() - rangeStart.getTime()) / (24 * 60 * 60 * 1000),
      );

      if (dayIndex < 0 || dayIndex >= buckets.length) continue;

      const bucket = buckets[dayIndex];
      if (!bucket) continue;

      bucket.reviewCount += 1;
    }

    for (const view of pageViews) {
      const dayIndex = Math.floor(
        (view.viewedAt.getTime() - rangeStart.getTime()) / (24 * 60 * 60 * 1000),
      );

      if (dayIndex < 0 || dayIndex >= buckets.length) continue;

      const bucket = buckets[dayIndex];
      if (!bucket) continue;

      bucket.pageVisits += 1;
    }

    return buckets.map(({ date, reviewCount, pageVisits }) => ({
      date,
      reviewCount,
      pageVisits,
    }));
  }

  private async getMonthlyPageVisits(companyId: string): Promise<number> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    return this.prisma.companyPageView.count({
      where: { companyId, viewedAt: { gte: monthStart } },
    });
  }

  private async getCompanyTopReviewers(companyId: string) {
    const groups = await this.prisma.review.groupBy({
      by: ['userId'],
      where: { companyId, status: 'APPROVED' },
      _count: { id: true },
      _avg: { rating: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    if (!groups.length) return [];

    const users = await this.prisma.user.findMany({
      where: { id: { in: groups.map((group) => group.userId) } },
      include: { profile: { select: { fullName: true, avatarUrl: true } } },
    });

    const userMap = new Map(users.map((user) => [user.id, user]));

    return groups.map((group) => {
      const user = userMap.get(group.userId);
      return {
        id: group.userId,
        name: user?.profile?.fullName ?? user?.displayName ?? user?.email ?? 'Reviewer',
        email: user?.email ?? '',
        reviewCount: group._count.id,
        ratingAverage: Number(group._avg.rating ?? 0),
        avatarUrl: user?.profile?.avatarUrl ?? null,
      };
    });
  }

  private async getCompanyLatestReviews(companyId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            phone: true,
            phoneVerified: true,
            profile: { select: { fullName: true, avatarUrl: true, phone: true } },
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            categoryId: true,
            email: true,
            owner: { select: { id: true, email: true } },
            category: { select: { id: true, nameEn: true, nameAr: true } },
          },
        },
        replies: true,
        attachments: true,
        serviceRatings: {
          include: { companyCatalogItem: { select: { id: true, nameEn: true, nameAr: true } } },
        },
      },
    });

    return reviews.map(toReviewPublic);
  }
}
