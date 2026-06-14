import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

const toBoolean = ({ value }: { value: unknown }): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true' || value === '1';
  return Boolean(value);
};

export class AppConfig {
  @IsString()
  @IsNotEmpty()
  NODE_ENV!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  PORT!: number;

  @IsString()
  @IsNotEmpty()
  API_PREFIX!: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  REDIS_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @IsString()
  JWT_ACCESS_EXPIRES_IN!: string;

  @IsString()
  JWT_REFRESH_EXPIRES_IN!: string;

  @IsString()
  @IsNotEmpty()
  IP_HASH_SECRET!: string;

  @IsString()
  CORS_ORIGINS!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  MODERATION_SCORE_THRESHOLD!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  MODERATION_NEW_ACCOUNT_DAYS!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  MODERATION_NEW_ACCOUNT_SCORE!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  MODERATION_VELOCITY_THRESHOLD!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  MODERATION_VELOCITY_WINDOW_HOURS!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  MODERATION_VELOCITY_SCORE!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  MODERATION_IP_HASH_SCORE!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  MODERATION_IP_LOOKBACK_DAYS!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  MODERATION_FINGERPRINT_SCORE!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  MODERATION_SIMILARITY_THRESHOLD!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  MODERATION_SIMILARITY_SCORE!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  MODERATION_SIMILARITY_LOOKBACK_DAYS!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  RATE_LIMIT_REVIEW_TTL!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  RATE_LIMIT_REVIEW_MAX!: number;

  @IsOptional()
  @IsString()
  RESEND_API_KEY?: string;

  @IsString()
  EMAIL_FROM!: string;

  @IsString()
  APP_URL!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  AUTH_VERIFICATION_EXPIRES_HOURS!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  AUTH_PASSWORD_RESET_EXPIRES_HOURS!: number;

  @Type(() => Number)
  @IsInt()
  @Min(60)
  AUTH_PHONE_OTP_TTL_SECONDS!: number;

  @Transform(toBoolean)
  @IsBoolean()
  SWAGGER_ENABLED!: boolean;

  @IsOptional()
  @IsString()
  FIREBASE_SERVICE_ACCOUNT_JSON?: string;

  /** Comma-separated Firebase Auth UIDs allowed to use the admin dashboard */
  @IsOptional()
  @IsString()
  FIREBASE_ADMIN_UIDS?: string;

  @IsOptional()
  @IsString()
  CONTACT_RECIPIENT_EMAIL?: string;
}

export function validateEnv(config: Record<string, unknown>): AppConfig {
  const validated = plainToInstance(AppConfig, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
    whitelist: true,
  });

  if (errors.length > 0) {
    const messages = errors.flatMap((error) => Object.values(error.constraints ?? {})).join('\n');
    throw new Error(`Environment validation failed:\n${messages}`);
  }

  return validated;
}
