import { Injectable } from '@nestjs/common';
import type { SiteSettingsPublic, UpdateSiteSettingsInput } from '@rateq/types';
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
};

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
    };
  }

  async updateSiteSettings(input: UpdateSiteSettingsInput): Promise<SiteSettingsPublic> {
    const data = {
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
    };

    await this.prisma.siteSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...data },
      update: data,
    });

    return this.getSiteSettings();
  }
}
