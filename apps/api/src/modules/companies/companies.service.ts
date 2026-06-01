import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AuthenticatedUser,
  CompanyDashboard,
  CompanyDetail,
  CompanyPublic,
  CreateCompanyInput,
  MessageResponse,
  PaginatedCompaniesResponse,
  UpdateCompanyInput,
} from '@rateq/types';
import { UserRole } from '@rateq/types';
import { slugify, withSlugSuffix } from '@rateq/utils';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { CompaniesRepository } from './repositories/companies.repository';
import { toCompanyDetail, toCompanyPublic } from './mappers/company.mapper';
import type { SearchCompaniesQueryDto } from './dto/search-companies-query.dto';

const RESERVED_SLUGS = new Set(['me', 'admin', 'search', 'status']);

@Injectable()
export class CompaniesService {
  constructor(private readonly companiesRepository: CompaniesRepository) {}

  async search(query: SearchCompaniesQueryDto): Promise<PaginatedCompaniesResponse> {
    const filters = {
      query: query.query,
      country: query.country,
      city: query.city,
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

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return toCompanyPublic(company);
  }

  async register(
    user: AuthenticatedUser,
    input: CreateCompanyInput,
  ): Promise<CompanyDetail> {
    if (user.role !== UserRole.COMPANY && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only company accounts can register a business profile');
    }

    if (!user.isVerified) {
      throw new ForbiddenException('Verify your email before registering a company');
    }

    const existing = await this.companiesRepository.findByOwnerId(user.id);

    if (existing) {
      throw new ConflictException('You already have a registered company');
    }

    const slug = await this.generateUniqueSlug(input.name);
    const company = await this.companiesRepository.create({
      name: input.name.trim(),
      slug,
      description: input.description?.trim() ?? null,
      logo: input.logo ?? null,
      country: input.country.trim(),
      city: input.city.trim(),
      owner: { connect: { id: user.id } },
    });

    return toCompanyDetail(company);
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

  async updateMyCompany(
    userId: string,
    input: UpdateCompanyInput,
  ): Promise<CompanyDetail> {
    const company = await this.companiesRepository.findByOwnerId(userId);

    if (!company) {
      throw new NotFoundException('No company profile found for this account');
    }

    return this.applyUpdate(company.id, company.slug, input);
  }

  async adminUpdate(
    companyId: string,
    input: UpdateCompanyInput,
  ): Promise<CompanyDetail> {
    const company = await this.companiesRepository.findById(companyId);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.applyUpdate(company.id, company.slug, input);
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

    const updated = await this.companiesRepository.update(companyId, {
      ...(input.name !== undefined && { name: input.name.trim(), slug }),
      ...(input.description !== undefined && {
        description: input.description?.trim() ?? null,
      }),
      ...(input.logo !== undefined && { logo: input.logo }),
      ...(input.country !== undefined && { country: input.country.trim() }),
      ...(input.city !== undefined && { city: input.city.trim() }),
    });

    return toCompanyDetail(updated);
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
