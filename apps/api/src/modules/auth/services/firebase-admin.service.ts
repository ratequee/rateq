import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
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

  async generatePasswordResetLink(email: string): Promise<string> {
    if (!this.initialized) {
      throw new ServiceUnavailableException(
        'Firebase authentication is not configured on the server',
      );
    }

    return admin.auth().generatePasswordResetLink(email.toLowerCase());
  }

  /**
   * Uploads a buffer to Firebase Storage and returns a public download URL
   * compatible with the client SDK getDownloadURL format.
   */
  async uploadPublicFile(path: string, buffer: Buffer, contentType: string): Promise<string> {
    if (!this.initialized) {
      throw new ServiceUnavailableException(
        'Firebase authentication is not configured on the server',
      );
    }

    const bucket = admin.storage().bucket();
    const token = randomUUID();
    const file = bucket.file(path);

    await file.save(buffer, {
      resumable: false,
      contentType,
      metadata: {
        cacheControl: 'public, max-age=31536000',
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
      },
    });

    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      path,
    )}?alt=media&token=${token}`;
  }

  /**
   * Downloads a file by Firebase download URL using Admin SDK when possible,
   * with HTTP fetch as a fallback for non-Firebase hosts.
   */
  async downloadFileFromUrl(url: string): Promise<Buffer> {
    if (!this.initialized) {
      throw new ServiceUnavailableException(
        'Firebase authentication is not configured on the server',
      );
    }

    const objectPath = this.parseFirebaseStorageObjectPath(url);
    if (objectPath) {
      const [buffer] = await admin.storage().bucket().file(objectPath).download();
      return buffer;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file (${response.status})`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  private parseFirebaseStorageObjectPath(url: string): string | null {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname;

      if (host === 'firebasestorage.googleapis.com') {
        const match = parsed.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)$/);
        if (!match?.[1]) return null;
        return decodeURIComponent(match[1]);
      }

      if (host.endsWith('.firebasestorage.app') || host.endsWith('.appspot.com')) {
        const match = parsed.pathname.match(/\/o\/(.+)$/);
        if (!match?.[1]) return null;
        return decodeURIComponent(match[1]);
      }

      return null;
    } catch {
      return null;
    }
  }
}
