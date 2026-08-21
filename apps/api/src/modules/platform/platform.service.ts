import { Injectable } from '@nestjs/common';
import type { LegalDocumentPoint, SiteSettingsPublic, UpdateSiteSettingsInput } from '@rateq/types';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

const DEFAULT_SETTINGS: SiteSettingsPublic = {
  address: '40-44 Street, Doha',
  phone: '+974 33044425',
  email: 'support@RateQ.com',
  website: 'https://www.rateq.qa/',
  instagramUrl: null,
  facebookUrl: null,
  twitterUrl: null,
  youtubeUrl: null,
  linkedinUrl: null,
  aboutTextEn:
    'Modern lifestyles call for protected consumption habits. RateQ offers the most objective company reviews in Qatar.',
  aboutTextAr:
    'أنماط الحياة الحديثة تتطلب عادات استهلاك محمية. تقدم RateQ أكثر مراجعات الشركات موضوعية في قطر.',
  privacyPolicyEn: null,
  privacyPolicyAr: null,
  termsOfServiceEn: null,
  termsOfServiceAr: null,
};

function parseLegalPoints(value: unknown): LegalDocumentPoint[] | null {
  if (value == null) return null;
  let raw: unknown = value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      raw = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(raw)) return null;

  const points: LegalDocumentPoint[] = [];
  for (const [index, item] of raw.entries()) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const title = typeof record.title === 'string' ? record.title.trim() : '';
    const description = typeof record.description === 'string' ? record.description.trim() : '';
    if (!title && !description) continue;
    const id =
      typeof record.id === 'string' && record.id.trim() ? record.id.trim() : `point-${index + 1}`;
    const sortOrder =
      typeof record.sortOrder === 'number' && Number.isFinite(record.sortOrder)
        ? record.sortOrder
        : index;
    points.push({ id, title, description, sortOrder });
  }

  if (points.length === 0) return null;
  return points.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

function serializeLegalPoints(
  points: LegalDocumentPoint[] | null | undefined,
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (points === undefined) return undefined;
  if (points === null || points.length === 0) return Prisma.JsonNull;

  const normalized = points
    .map((point, index) => ({
      id: point.id?.trim() || `point-${index + 1}`,
      title: point.title.trim(),
      description: point.description.trim(),
      sortOrder: typeof point.sortOrder === 'number' ? point.sortOrder : index,
    }))
    .filter((point) => point.title.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((point, index) => ({ ...point, sortOrder: index }));

  return normalized.length > 0 ? normalized : Prisma.JsonNull;
}

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicStats() {
    const [totalCompanies, totalReviewers, totalReviews] = await Promise.all([
      this.prisma.company.count({ where: { verificationStatus: 'APPROVED' } }),
      this.prisma.user.count({
        where: { role: 'USER', profile: { isNot: null } },
      }),
      this.prisma.review.count({ where: { status: 'APPROVED' } }),
    ]);

    return { totalCompanies, totalReviewers, totalReviews };
  }

  async getSiteSettings(): Promise<SiteSettingsPublic> {
    const row = await this.prisma.siteSettings.findUnique({ where: { id: 'default' } });
    if (!row) return { ...DEFAULT_SETTINGS };

    return {
      address: row.address ?? DEFAULT_SETTINGS.address,
      phone: row.phone ?? DEFAULT_SETTINGS.phone,
      email: row.email ?? DEFAULT_SETTINGS.email,
      website: row.website ?? DEFAULT_SETTINGS.website,
      instagramUrl: row.instagramUrl,
      facebookUrl: row.facebookUrl,
      twitterUrl: row.twitterUrl,
      youtubeUrl: row.youtubeUrl,
      linkedinUrl: row.linkedinUrl,
      aboutTextEn: row.aboutTextEn ?? DEFAULT_SETTINGS.aboutTextEn,
      aboutTextAr: row.aboutTextAr ?? DEFAULT_SETTINGS.aboutTextAr,
      privacyPolicyEn: parseLegalPoints(row.privacyPolicyEn),
      privacyPolicyAr: parseLegalPoints(row.privacyPolicyAr),
      termsOfServiceEn: parseLegalPoints(row.termsOfServiceEn),
      termsOfServiceAr: parseLegalPoints(row.termsOfServiceAr),
    };
  }

  async updateSiteSettings(input: UpdateSiteSettingsInput): Promise<SiteSettingsPublic> {
    const privacyPolicyEn = serializeLegalPoints(input.privacyPolicyEn);
    const privacyPolicyAr = serializeLegalPoints(input.privacyPolicyAr);
    const termsOfServiceEn = serializeLegalPoints(input.termsOfServiceEn);
    const termsOfServiceAr = serializeLegalPoints(input.termsOfServiceAr);

    const data: Prisma.SiteSettingsUpdateInput = {
      ...(input.address !== undefined && { address: input.address?.trim() || null }),
      ...(input.phone !== undefined && { phone: input.phone?.trim() || null }),
      ...(input.email !== undefined && { email: input.email?.trim() || null }),
      ...(input.website !== undefined && { website: input.website?.trim() || null }),
      ...(input.instagramUrl !== undefined && {
        instagramUrl: input.instagramUrl?.trim() || null,
      }),
      ...(input.facebookUrl !== undefined && { facebookUrl: input.facebookUrl?.trim() || null }),
      ...(input.twitterUrl !== undefined && { twitterUrl: input.twitterUrl?.trim() || null }),
      ...(input.youtubeUrl !== undefined && { youtubeUrl: input.youtubeUrl?.trim() || null }),
      ...(input.linkedinUrl !== undefined && { linkedinUrl: input.linkedinUrl?.trim() || null }),
      ...(input.aboutTextEn !== undefined && { aboutTextEn: input.aboutTextEn?.trim() || null }),
      ...(input.aboutTextAr !== undefined && { aboutTextAr: input.aboutTextAr?.trim() || null }),
      ...(privacyPolicyEn !== undefined && { privacyPolicyEn }),
      ...(privacyPolicyAr !== undefined && { privacyPolicyAr }),
      ...(termsOfServiceEn !== undefined && { termsOfServiceEn }),
      ...(termsOfServiceAr !== undefined && { termsOfServiceAr }),
    };

    await this.prisma.siteSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...(data as Prisma.SiteSettingsCreateInput) },
      update: data,
    });

    return this.getSiteSettings();
  }
}
