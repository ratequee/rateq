import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * True when a Google Maps API key was baked into the native binary at build time.
 * Android MapView crashes hard without `com.google.android.geo.API_KEY` in the manifest.
 */
export function isNativeGoogleMapsConfigured(): boolean {
  if (Platform.OS !== 'android') {
    return true;
  }

  return Boolean(Constants.expoConfig?.extra?.googleMapsApiKeyConfigured);
}
