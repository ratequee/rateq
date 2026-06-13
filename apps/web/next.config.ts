import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  transpilePackages: ['@rateq/ui', '@rateq/types'],
  serverExternalPackages: ['firebase'],
  webpack: (config) => {
    // Firebase Auth optional RN peer — not used on web; avoid monorepo hoisting issues.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
    };
    return config;
  },
};

export default withNextIntl(nextConfig);
