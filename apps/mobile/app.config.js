/**
 * Expo app config. Uses app.config.js so env vars (e.g. Maps API key) resolve at
 * prebuild/EAS build time — app.json cannot interpolate process.env.
 *
 * Android Maps require `com.google.android.geo.API_KEY` in AndroidManifest. That
 * value is injected by the react-native-maps config plugin from
 * EXPO_PUBLIC_GOOGLE_MAPS_API_KEY. Without it, opening the map screen crashes.
 *
 * On EAS, prefer Environment Variables (development/preview/production). Local
 * `.env` is a fallback when uploaded via root `.easignore` (`!.env`).
 */
const path = require('path');
const fs = require('fs');

function loadDotEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Prefer already-set EAS/CI env; only fill gaps from .env
    if (key && (process.env[key] === undefined || process.env[key] === '')) {
      process.env[key] = value;
    }
  }
}

try {
  // Prefer Expo's loader when available (resolves from the monorepo).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require(require.resolve('@expo/env', { paths: [__dirname] })).load(__dirname);
} catch {
  // fall through to manual .env parse
}

loadDotEnvFile(path.join(__dirname, '.env'));

const googleMapsApiKey = (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '').trim();

if (process.env.EAS_BUILD === 'true' && !googleMapsApiKey) {
  throw new Error(
    'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is missing on EAS. Add it under Project → Environment variables (development/preview/production), then rebuild. Android MapView crashes without com.google.android.geo.API_KEY in AndroidManifest.xml.',
  );
}

/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: 'RateQ',
  slug: 'rateq',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'rateq',
  userInterfaceStyle: 'automatic',
  icon: './assets/images/icon.png',
  splash: {
    backgroundColor: '#8E2157',
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
  },
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.rateq.app',
    usesAppleSignIn: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    // Master App Store icon — EAS generates all device sizes from this 1024² asset
    icon: './assets/images/icon.png',
    config: googleMapsApiKey
      ? {
          googleMapsApiKey,
        }
      : undefined,
  },
  android: {
    package: 'com.rateq.app',
    // Legacy launcher icon (pre-adaptive devices)
    icon: './assets/images/icon.png',
    adaptiveIcon: {
      // 1024² foreground; key art inside center ~626² safe zone (66/108 dp)
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#8E2157',
    },
    permissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
    ],
    config: googleMapsApiKey
      ? {
          googleMaps: {
            apiKey: googleMapsApiKey,
          },
        }
      : undefined,
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#8E2157',
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
      },
    ],
    'expo-localization',
    'expo-secure-store',
    'expo-font',
    'expo-image-picker',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Allow RateQ to access your location to set your business address on the map.',
      },
    ],
    '@react-native-community/datetimepicker',
    'expo-apple-authentication',
    'expo-dev-client',
    [
      '@react-native-google-signin/google-signin',
      {
        iosUrlScheme: 'com.googleusercontent.apps.180199809063-89idmqk34in7j99ddbaqbof8vt6eq27d',
      },
    ],
    // Always pass the key when present. Bare `react-native-maps` with no props
    // REMOVES com.google.android.geo.API_KEY from the manifest.
    ...(googleMapsApiKey
      ? [
          [
            'react-native-maps',
            {
              androidGoogleMapsApiKey: googleMapsApiKey,
              iosGoogleMapsApiKey: googleMapsApiKey,
            },
          ],
        ]
      : []),
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: 'b7b85eef-0922-4aae-a8ca-ea1832cc3665',
    },
    router: {
      origin: false,
    },
    googleMapsApiKeyConfigured: Boolean(googleMapsApiKey),
  },
  owner: 'rateq90',
};

module.exports = config;
