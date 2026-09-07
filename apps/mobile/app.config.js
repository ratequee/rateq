/**
 * Expo app config. Uses app.config.js so env vars (e.g. Maps API key) resolve at
 * prebuild/EAS build time — app.json cannot interpolate process.env.
 */
const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

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
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#8E2157',
  },
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.rateq.app',
    usesAppleSignIn: true,
    config: googleMapsApiKey
      ? {
          googleMapsApiKey,
        }
      : undefined,
  },
  android: {
    package: 'com.rateq.app',
    adaptiveIcon: {
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
        image: './assets/images/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#8E2157',
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
      : ['react-native-maps']),
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
