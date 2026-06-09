import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import type { AppConfig } from './common/config/env.validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService<AppConfig, true>);
  const port = configService.get('PORT', { infer: true });
  const apiPrefix = configService.get('API_PREFIX', { infer: true });
  // API_PREFIX is often "api/v1" while URI versioning also adds "/v1" — strip trailing version to avoid /api/v1/v1/...
  const globalPrefix = apiPrefix.replace(/\/v\d+$/, '') || 'api';
  const corsOrigins = configService
    .get('CORS_ORIGINS', { infer: true })
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const swaggerEnabled = configService.get('SWAGGER_ENABLED', { infer: true });
  const nodeEnv = configService.get('NODE_ENV', { infer: true });

  app.setGlobalPrefix(globalPrefix);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('RateQ API')
      .setDescription('Bilingual review platform REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(port);
  console.log(`RateQ API running on http://localhost:${port}/${globalPrefix}/v1`);
  if (swaggerEnabled) {
    console.log(`Swagger docs: http://localhost:${port}/docs`);
  }
  if (nodeEnv === 'development') {
    console.log('Environment: development');
  }
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start application', error);
  process.exit(1);
});
