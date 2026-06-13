import { Injectable, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
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
      const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
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
}
