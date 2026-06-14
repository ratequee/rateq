import type { AppConfig } from '../../src/common/config/env.validation';

/** Default moderation config for unit tests */
export function createMockConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    NODE_ENV: 'test',
    PORT: 4000,
    API_PREFIX: 'api/v1',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'test-access-secret-min-32-characters-long',
    JWT_REFRESH_SECRET: 'test-refresh-secret-min-32-characters-long',
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
    IP_HASH_SECRET: 'test-ip-hash-secret-min-32-characters-long',
    CORS_ORIGINS: 'http://localhost:3000',
    MODERATION_SCORE_THRESHOLD: 5,
    MODERATION_NEW_ACCOUNT_DAYS: 7,
    MODERATION_NEW_ACCOUNT_SCORE: 2,
    MODERATION_VELOCITY_THRESHOLD: 10,
    MODERATION_VELOCITY_WINDOW_HOURS: 1,
    MODERATION_VELOCITY_SCORE: 3,
    MODERATION_IP_HASH_SCORE: 2,
    MODERATION_IP_LOOKBACK_DAYS: 30,
    MODERATION_FINGERPRINT_SCORE: 2,
    MODERATION_SIMILARITY_THRESHOLD: 0.85,
    MODERATION_SIMILARITY_SCORE: 3,
    MODERATION_SIMILARITY_LOOKBACK_DAYS: 30,
    RATE_LIMIT_REVIEW_TTL: 60,
    RATE_LIMIT_REVIEW_MAX: 3,
    EMAIL_FROM: 'test@rateq.local',
    APP_URL: 'http://localhost:3000',
    AUTH_VERIFICATION_EXPIRES_HOURS: 24,
    AUTH_PASSWORD_RESET_EXPIRES_HOURS: 1,
    AUTH_PHONE_OTP_TTL_SECONDS: 900,
    SWAGGER_ENABLED: false,
    ...overrides,
  };
}

export function mockConfigService(overrides: Partial<AppConfig> = {}) {
  const config = createMockConfig(overrides);
  return {
    get: jest.fn((key: keyof AppConfig) => config[key]),
  };
}
