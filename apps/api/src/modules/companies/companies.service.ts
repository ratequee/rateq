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
import { UserRole as PrismaUserRole } from '@prisma/client';
import { slugify, withSlugSuffix } from '@rateq/utils';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { CompaniesRepository } from './repositories/companies.repository';
import { CategoriesService } from '../categories/categories.service';
import { PhoneOtpService } from '../phone-verification/phone-otp.service';
import { EmailService } from '../auth/services/email.service';
import { toCompanyDetail, toCompanyPublic } from './mappers/company.mapper';
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
      data: companies.map(toCompanyPublic),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async getPublicProfile(slug: string): Promise<CompanyPublic> {
    const company = await this.companiesRepository.findBySlug(slug);

    if (!company || company.verificationStatus !== 'APPROVED') {
      throw new NotFoundException('Company not found');
    }

    return toCompanyPublic(company);
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

    await this.companiesRepository.create({
      name: input.name.trim(),
      slug,
      email: user.email,
      phone: input.phone.trim(),
      description: input.description?.trim() ?? null,
      logo: input.logo,
      coverUrl: input.coverUrl,
      address: input.address.trim(),
      crNumber: input.crNumber.trim(),
      validationDate: new Date(input.validationDate),
      registrationDocUrl: input.registrationDocUrl ?? null,
      establishmentCardUrl: input.establishmentCardUrl,
      tradeLicenseUrl: input.tradeLicenseUrl,
      verificationStatus: 'PENDING',
      country: input.country.trim(),
      city: input.city.trim(),
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
    return toCompanyDetail(withRelations!);
  }

  async getMyCompany(userId: string): Promise<CompanyDetail> {
    const company = await this.companiesRepository.findByOwnerId(userId);

    if (!company) {
      throw new NotFoundException('No company profile found for this account');
    }

    return toCompanyDetail(company);
  }

  async getDashboard(userId: string): Promise<CompanyDashboard> {
    const company = await this.companiesRepository.findByOwnerId(userId);

    if (!company) {
      throw new NotFoundException('No company profile found for this account');
    }

    const reviewStats = await this.companiesRepository.getReviewStats(company.id);

    return {
      company: toCompanyDetail(company),
      stats: {
        ...reviewStats,
        averageRating: Number(company.ratingAverage),
      },
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
      return toCompanyDetail(reset);
    }

    return updated;
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

      const withOwner = await this.companiesRepository.findByIdWithOwner(updated.id);
      return toAdminCompanyVerificationDetail(withOwner!);
    }

    if (input.status === 'rejected') {
      if (ownerEmail) {
        await this.emailService.sendCompanyVerificationRejectedEmail(ownerEmail, companyName);
      }

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
      ...(input.description !== undefined && {
        description: input.description?.trim() ?? null,
      }),
      ...(input.logo !== undefined && { logo: input.logo }),
      ...(input.coverUrl !== undefined && { coverUrl: input.coverUrl }),
      ...(input.address !== undefined && { address: input.address.trim() }),
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

    const refreshed = await this.companiesRepository.findById(companyId);
    return toCompanyDetail(refreshed!);
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
}
