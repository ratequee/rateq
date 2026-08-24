import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { withTimeout } from '../../../common/utils/with-timeout.util';
import { FirebaseAdminService } from '../../auth/services/firebase-admin.service';

export const PROJECT_WATERMARK_TEXT = 'https://www.rateq.qa/';

@Injectable()
export class ProjectImageWatermarkService {
  private readonly logger = new Logger(ProjectImageWatermarkService.name);

  constructor(private readonly firebaseAdmin: FirebaseAdminService) {}

  async watermarkProjectImages(input: {
    projectId: string;
    companyId: string;
    imageUrl: string;
    demoImages: string[];
  }): Promise<{ imageUrl: string; demoImages: string[] }> {
    if (!this.firebaseAdmin.isConfigured()) {
      this.logger.warn('Skipping project watermarks: Firebase Storage is not configured');
      return { imageUrl: input.imageUrl, demoImages: input.demoImages };
    }

    const imageUrl = await this.watermarkAndUpload(
      input.imageUrl,
      input.companyId,
      input.projectId,
      'cover',
    );

    const demoImages = await Promise.all(
      input.demoImages.map((sourceUrl, index) => {
        if (!sourceUrl) return Promise.resolve('');
        return this.watermarkAndUpload(
          sourceUrl,
          input.companyId,
          input.projectId,
          `demo-${index + 1}`,
        );
      }),
    );

    return { imageUrl, demoImages: demoImages.filter(Boolean) };
  }

  private async watermarkAndUpload(
    sourceUrl: string,
    companyId: string,
    projectId: string,
    label: string,
  ): Promise<string> {
    try {
      if (sourceUrl.includes('/watermarked/')) {
        return sourceUrl;
      }

      const source = await withTimeout(
        this.firebaseAdmin.downloadFileFromUrl(sourceUrl),
        20_000,
        `download ${label}`,
      );
      const watermarked = await this.applyWatermark(source);
      const path = `users/system/company-projects/${companyId}/${projectId}/watermarked/${Date.now()}-${label}.jpg`;
      return await withTimeout(
        this.firebaseAdmin.uploadPublicFile(path, watermarked, 'image/jpeg'),
        20_000,
        `upload ${label}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to watermark image for project ${projectId} (${label}): ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      return sourceUrl;
    }
  }

  private async applyWatermark(source: Buffer): Promise<Buffer> {
    const image = sharp(source)
      .rotate()
      .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true });
    const metadata = await image.clone().metadata();
    const width = metadata.width ?? 1200;
    const height = metadata.height ?? 800;
    const fontSize = Math.max(28, Math.round(Math.min(width, height) * 0.055));
    const opacity = 0.38;
    const angle = -30;
    const escaped = PROJECT_WATERMARK_TEXT.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const svg = Buffer.from(
      `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <text
          x="50%"
          y="50%"
          fill="white"
          fill-opacity="${opacity}"
          font-size="${fontSize}"
          font-family="Arial, Helvetica, sans-serif"
          font-weight="700"
          letter-spacing="1"
          text-anchor="middle"
          dominant-baseline="middle"
          transform="rotate(${angle} ${width / 2} ${height / 2})"
        >${escaped}</text>
      </svg>`,
    );

    return image
      .composite([{ input: svg, top: 0, left: 0 }])
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
  }
}
