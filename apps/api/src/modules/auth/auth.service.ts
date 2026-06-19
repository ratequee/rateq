import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { UserRole as PrismaUserRole } from '@prisma/client';
import type { AuthResponse, AuthenticatedUser, AuthTokens, MessageResponse } from '@rateq/types';
import { UserRole } from '@rateq/types';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './repositories/auth.repository';
import { EmailService } from './services/email.service';
import { TokenService } from './services/token.service';
import { toAuthenticatedUser } from './mappers/user.mapper';
import { generateSecureToken, hashToken } from './utils/token-hash.util';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import { FirebaseAdminService } from './services/firebase-admin.service';
import { FirebaseAdminAccessService } from './services/firebase-admin-access.service';
import type { FirebaseLoginDto } from './dto/firebase-login.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly firebaseAdminAccess: FirebaseAdminAccessService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = dto.email.toLowerCase();
    const existing = await this.authRepository.findUserByEmail(email);

    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const role = (dto.role ?? UserRole.USER) as PrismaUserRole;

    const user = await this.authRepository.createUser({
      email,
      passwordHash,
      role,
    });

    await this.sendVerificationEmail(user.id, user.email);

    const tokens = await this.tokenService.createTokenPair(user);

    return {
      user: toAuthenticatedUser(user),
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.authRepository.findUserByEmail(dto.email.toLowerCase());

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    const tokens = await this.tokenService.createTokenPair(user);

    return {
      user: toAuthenticatedUser(user),
      tokens,
    };
  }

  async loginWithFirebase(dto: FirebaseLoginDto): Promise<AuthResponse> {
    const firebaseUser = await this.firebaseAdmin.verifyIdToken(dto.idToken);
    const displayName = firebaseUser.name?.trim();

    let user =
      (await this.authRepository.findUserByFirebaseUid(firebaseUser.uid)) ??
      (await this.authRepository.findUserByEmail(firebaseUser.email));

    if (user && !user.firebaseUid) {
      user = await this.authRepository.linkFirebaseUser(user.id, {
        firebaseUid: firebaseUser.uid,
        isVerified: firebaseUser.emailVerified,
      });
    } else if (!user) {
      user = await this.authRepository.createUser({
        email: firebaseUser.email,
        firebaseUid: firebaseUser.uid,
        displayName,
        role: PrismaUserRole.USER,
        isVerified: firebaseUser.emailVerified,
      });
    } else if (firebaseUser.emailVerified && !user.isVerified) {
      user = await this.authRepository.markUserVerified(user.id);
    }

    if (displayName && !user.displayName) {
      user = await this.authRepository.updateDisplayNameIfEmpty(user.id, displayName);
    }

    user = await this.syncFirebaseAdminRole(user, firebaseUser.uid);

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    const tokens = await this.tokenService.createTokenPair(user);

    return {
      user: toAuthenticatedUser(user),
      tokens,
    };
  }

  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    const { record, tokenHash } = await this.tokenService.validateRefreshToken(rawRefreshToken);

    if (!record.user.isActive) {
      await this.authRepository.deleteRefreshTokensByUserId(record.userId);
      throw new UnauthorizedException('Account has been deactivated');
    }

    const rotated = await this.tokenService.rotateRefreshToken(tokenHash, record.userId);
    const accessToken = this.tokenService.createAccessToken(record.user);

    return {
      accessToken,
      refreshToken: rotated.rawToken,
    };
  }

  async logout(userId: string, refreshToken?: string): Promise<MessageResponse> {
    if (refreshToken) {
      await this.authRepository.deleteRefreshTokenByHash(hashToken(refreshToken));
    } else {
      await this.authRepository.deleteRefreshTokensByUserId(userId);
    }

    return { message: 'Logged out successfully' };
  }

  getProfile(user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  async getFirebaseAdminAccess(userId: string): Promise<{ allowed: boolean }> {
    const user = await this.authRepository.findUserById(userId);

    if (!user?.firebaseUid) {
      return { allowed: false };
    }

    return { allowed: this.firebaseAdminAccess.isWhitelisted(user.firebaseUid) };
  }

  private async syncFirebaseAdminRole(user: User, firebaseUid: string): Promise<User> {
    const shouldBeAdmin = this.firebaseAdminAccess.isWhitelisted(firebaseUid);

    if (shouldBeAdmin && user.role !== PrismaUserRole.ADMIN) {
      return this.authRepository.updateUserRole(user.id, PrismaUserRole.ADMIN);
    }

    if (
      !shouldBeAdmin &&
      user.role === PrismaUserRole.ADMIN &&
      user.firebaseUid &&
      this.firebaseAdminAccess.hasAnyAdmin()
    ) {
      return this.authRepository.updateUserRole(user.id, PrismaUserRole.USER);
    }

    return user;
  }

  async verifyEmail(rawToken: string): Promise<MessageResponse> {
    const tokenHash = hashToken(rawToken);
    const verification = await this.authRepository.findEmailVerificationByHash(tokenHash);

    if (!verification) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (verification.expiresAt < new Date()) {
      await this.authRepository.deleteEmailVerificationsByUserId(verification.userId);
      throw new BadRequestException('Verification token has expired');
    }

    if (verification.user.isVerified) {
      await this.authRepository.deleteEmailVerificationsByUserId(verification.userId);
      return { message: 'Email is already verified' };
    }

    await this.authRepository.markUserVerified(verification.userId);
    await this.authRepository.deleteEmailVerificationsByUserId(verification.userId);

    return { message: 'Email verified successfully' };
  }

  async resendVerification(user: AuthenticatedUser): Promise<MessageResponse> {
    if (user.isVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.sendVerificationEmail(user.id, user.email);

    return { message: 'Verification email sent' };
  }

  async forgotPassword(email: string): Promise<MessageResponse> {
    const user = await this.authRepository.findUserByEmail(email.toLowerCase());

    if (user) {
      await this.sendPasswordResetEmail(user.id, user.email);
    }

    return {
      message: 'If an account exists for this email, a password reset link has been sent',
    };
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<MessageResponse> {
    const tokenHash = hashToken(rawToken);
    const reset = await this.authRepository.findPasswordResetByHash(tokenHash);

    if (!reset || reset.usedAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (reset.expiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.authRepository.updatePassword(reset.userId, passwordHash);
    await this.authRepository.markPasswordResetUsed(reset.id);
    await this.authRepository.deleteRefreshTokensByUserId(reset.userId);

    return { message: 'Password reset successfully' };
  }

  private async sendVerificationEmail(userId: string, email: string): Promise<void> {
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = this.tokenService.getVerificationExpiry();

    await this.authRepository.replaceEmailVerification(userId, tokenHash, expiresAt);
    await this.emailService.sendVerificationEmail(email, rawToken);
  }

  private async sendPasswordResetEmail(userId: string, email: string): Promise<void> {
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = this.tokenService.getPasswordResetExpiry();

    await this.authRepository.replacePasswordReset(userId, tokenHash, expiresAt);
    await this.emailService.sendPasswordResetEmail(email, rawToken);
  }
}
