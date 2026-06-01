import { Injectable } from '@nestjs/common';
import type { Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  createUser(data: {
    email: string;
    passwordHash: string;
    role: UserRole;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        role: data.role,
      },
    });
  }

  markUserVerified(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });
  }

  updatePassword(userId: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    return this.prisma.refreshToken
      .create({ data })
      .then(() => undefined);
  }

  findRefreshTokenByHash(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  deleteRefreshTokenByHash(tokenHash: string): Promise<void> {
    return this.prisma.refreshToken
      .delete({ where: { tokenHash } })
      .then(() => undefined)
      .catch(() => undefined);
  }

  deleteRefreshTokensByUserId(userId: string): Promise<void> {
    return this.prisma.refreshToken
      .deleteMany({ where: { userId } })
      .then(() => undefined);
  }

  deleteExpiredRefreshTokens(): Promise<void> {
    return this.prisma.refreshToken
      .deleteMany({ where: { expiresAt: { lt: new Date() } } })
      .then(() => undefined);
  }

  replaceEmailVerification(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.emailVerification.deleteMany({ where: { userId } });
      await tx.emailVerification.create({
        data: { userId, tokenHash, expiresAt },
      });
    });
  }

  findEmailVerificationByHash(tokenHash: string) {
    return this.prisma.emailVerification.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  deleteEmailVerificationsByUserId(userId: string): Promise<void> {
    return this.prisma.emailVerification
      .deleteMany({ where: { userId } })
      .then(() => undefined);
  }

  replacePasswordReset(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.passwordReset.deleteMany({
        where: { userId, usedAt: null },
      });
      await tx.passwordReset.create({
        data: { userId, tokenHash, expiresAt },
      });
    });
  }

  findPasswordResetByHash(tokenHash: string) {
    return this.prisma.passwordReset.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  markPasswordResetUsed(id: string): Promise<void> {
    return this.prisma.passwordReset
      .update({
        where: { id },
        data: { usedAt: new Date() },
      })
      .then(() => undefined);
  }
}
