import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import type { AppConfig } from '../../../common/config/env.validation';

export interface VerifiedFirebaseUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  name?: string;
}

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private initialized = false;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  onModuleInit(): void {
    if (admin.apps.length > 0) {
      this.initialized = true;
      return;
    }

    const serviceAccountJson = this.configService.get('FIREBASE_SERVICE_ACCOUNT_JSON', {
      infer: true,
    });

    if (!serviceAccountJson) {
      return;
    }

    try {
      const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount & {
        project_id?: string;
      };
      const projectId = serviceAccount.projectId ?? serviceAccount.project_id;
      const storageBucket =
        this.configService.get('FIREBASE_STORAGE_BUCKET', { infer: true }) ??
        (projectId ? `${projectId}.firebasestorage.app` : undefined);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        ...(storageBucket ? { storageBucket } : {}),
      });
      this.initialized = true;
    } catch {
      throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON for Firebase Admin');
    }
  }

  isConfigured(): boolean {
    return this.initialized;
  }

  async createUser(input: {
    email: string;
    password: string;
    displayName?: string;
  }): Promise<{ uid: string }> {
    if (!this.initialized) {
      throw new ServiceUnavailableException(
        'Firebase authentication is not configured on the server',
      );
    }

    const record = await admin.auth().createUser({
      email: input.email.toLowerCase(),
      password: input.password,
      displayName: input.displayName?.trim() || undefined,
      emailVerified: true,
    });

    return { uid: record.uid };
  }

  async verifyIdToken(idToken: string): Promise<VerifiedFirebaseUser> {
    if (!this.initialized) {
      throw new ServiceUnavailableException(
        'Firebase authentication is not configured on the server',
      );
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = decoded.email;

    if (!email) {
      throw new ServiceUnavailableException('Firebase account is missing an email address');
    }

    return {
      uid: decoded.uid,
      email: email.toLowerCase(),
      emailVerified: decoded.email_verified ?? false,
      name: decoded.name,
    };
  }

  async getVerifiedPhoneNumber(firebaseUid: string): Promise<string | null> {
    if (!this.initialized) {
      throw new ServiceUnavailableException(
        'Firebase authentication is not configured on the server',
      );
    }

    try {
      const record = await admin.auth().getUser(firebaseUid);
      return record.phoneNumber ?? null;
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code: unknown }).code)
          : 'unknown';

      if (code === 'auth/user-not-found') {
        return null;
      }

      throw error;
    }
  }

  async deleteAuthUser(firebaseUid: string): Promise<void> {
    if (!this.initialized || !firebaseUid) return;

    try {
      await admin.auth().deleteUser(firebaseUid);
      this.logger.log(`Deleted Firebase Auth user ${firebaseUid}`);
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code: unknown }).code)
          : 'unknown';

      if (code === 'auth/user-not-found') {
        return;
      }

      this.logger.warn(`Failed to delete Firebase Auth user ${firebaseUid}: ${code}`);
      throw error;
    }
  }

  async deleteUserStorage(firebaseUid: string): Promise<void> {
    if (!this.initialized || !firebaseUid) return;

    try {
      const bucket = admin.storage().bucket();
      await bucket.deleteFiles({ prefix: `users/${firebaseUid}/` });
      this.logger.log(`Deleted Firebase Storage files for ${firebaseUid}`);
    } catch (error) {
      this.logger.warn(
        `Failed to delete Firebase Storage files for ${firebaseUid}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }
}
