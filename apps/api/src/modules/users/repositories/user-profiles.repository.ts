import { Injectable } from '@nestjs/common';
import type { Prisma, UserProfile } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class UserProfilesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string): Promise<UserProfile | null> {
    return this.prisma.userProfile.findUnique({ where: { userId } });
  }

  upsert(userId: string, data: Prisma.UserProfileCreateWithoutUserInput): Promise<UserProfile> {
    return this.prisma.userProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }
}
