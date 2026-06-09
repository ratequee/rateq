import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../../common/config/env.validation';

@Injectable()
export class FirebaseAdminAccessService {
  private readonly allowedUids: Set<string>;

  constructor(configService: ConfigService<AppConfig, true>) {
    const raw = configService.get('FIREBASE_ADMIN_UIDS', { infer: true }) ?? '';
    this.allowedUids = new Set(
      raw
        .split(',')
        .map((uid) => uid.trim())
        .filter(Boolean),
    );
  }

  isWhitelisted(firebaseUid: string): boolean {
    return this.allowedUids.has(firebaseUid);
  }

  hasAnyAdmin(): boolean {
    return this.allowedUids.size > 0;
  }
}
