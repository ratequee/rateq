import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './common/config/env.validation';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { AdminModule } from './modules/admin/admin.module';
import { ContactModule } from './modules/contact/contact.module';
import { PlatformModule } from './modules/platform/platform.module';
import { BlogModule } from './modules/blog/blog.module';

/**
 * Root application module — modular monolith.
 *
 * Each feature module is a bounded context that can be extracted
 * into a microservice without changing internal contracts.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    RedisModule,
    QueueModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    ReviewsModule,
    ModerationModule,
    CategoriesModule,
    AdminModule,
    ContactModule,
    PlatformModule,
    BlogModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
