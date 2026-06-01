import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import type { AuthTokens, JwtPayload } from '@rateq/types';
import type { AppConfig } from '../../../common/config/env.validation';
import { AuthRepository } from '../repositories/auth.repository';
import { addHours, generateSecureToken, hashToken } from '../utils/token-hash.util';

export interface IssuedRefreshToken {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly authRepository: AuthRepository,
  ) {}

  createAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as JwtPayload['role'],
      type: 'access',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET', { infer: true }),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', { infer: true }),
    });
  }

  async issueRefreshToken(userId: string): Promise<IssuedRefreshToken> {
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = this.getRefreshTokenExpiry();

    await this.authRepository.createRefreshToken({
      userId,
      tokenHash,
      expiresAt,
    });

    return { rawToken, tokenHash, expiresAt };
  }

  async rotateRefreshToken(currentHash: string, userId: string): Promise<IssuedRefreshToken> {
    await this.authRepository.deleteRefreshTokenByHash(currentHash);
    return this.issueRefreshToken(userId);
  }

  async validateRefreshToken(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    const record = await this.authRepository.findRefreshTokenByHash(tokenHash);

    if (!record) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (record.expiresAt < new Date()) {
      await this.authRepository.deleteRefreshTokenByHash(tokenHash);
      throw new UnauthorizedException('Refresh token expired');
    }

    return { record, tokenHash };
  }

  async createTokenPair(user: User): Promise<AuthTokens> {
    const accessToken = this.createAccessToken(user);
    const refresh = await this.issueRefreshToken(user.id);

    return {
      accessToken,
      refreshToken: refresh.rawToken,
    };
  }

  getVerificationExpiry(): Date {
    const hours = this.configService.get('AUTH_VERIFICATION_EXPIRES_HOURS', { infer: true });
    return addHours(new Date(), hours);
  }

  getPasswordResetExpiry(): Date {
    const hours = this.configService.get('AUTH_PASSWORD_RESET_EXPIRES_HOURS', { infer: true });
    return addHours(new Date(), hours);
  }

  private getRefreshTokenExpiry(): Date {
    const expiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', { infer: true });
    const match = /^(\d+)([dhms])$/.exec(expiresIn);

    if (!match) {
      return addHours(new Date(), 24 * 7);
    }

    const value = Number(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'd':
        return addHours(new Date(), value * 24);
      case 'h':
        return addHours(new Date(), value);
      case 'm':
        return new Date(Date.now() + value * 60 * 1000);
      case 's':
        return new Date(Date.now() + value * 1000);
      default:
        return addHours(new Date(), 24 * 7);
    }
  }
}
