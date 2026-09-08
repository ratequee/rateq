import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

const MARKER_LOGO_PX = 96;
const CACHE_DIR = `${FileSystem.cacheDirectory}map-marker-logos/`;

const inFlight = new Map<string, Promise<string | null>>();

function cacheKeyForUrl(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i += 1) {
    hash = (hash * 31 + url.charCodeAt(i)) | 0;
  }
  return `logo_${Math.abs(hash).toString(36)}`;
}

/**
 * Download a remote company logo, resize to a fixed square, and return a local
 * file URI. Local bitmaps paint reliably inside Android map markers (Fabric).
 */
export async function getMapMarkerLogoUri(remoteUrl: string): Promise<string | null> {
  const existing = inFlight.get(remoteUrl);
  if (existing) return existing;

  const task = (async (): Promise<string | null> => {
    try {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });

      const key = cacheKeyForUrl(remoteUrl);
      const finalPath = `${CACHE_DIR}${key}.png`;
      const finalInfo = await FileSystem.getInfoAsync(finalPath);
      if (finalInfo.exists) {
        return finalPath;
      }

      const sourcePath = `${CACHE_DIR}${key}-src`;
      const downloaded = await FileSystem.downloadAsync(remoteUrl, sourcePath);
      const resized = await ImageManipulator.manipulateAsync(
        downloaded.uri,
        [{ resize: { width: MARKER_LOGO_PX, height: MARKER_LOGO_PX } }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG },
      );

      await FileSystem.copyAsync({ from: resized.uri, to: finalPath });
      return finalPath;
    } catch {
      return null;
    }
  })();

  inFlight.set(remoteUrl, task);
  return task;
}
