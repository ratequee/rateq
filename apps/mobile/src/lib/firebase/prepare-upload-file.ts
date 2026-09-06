import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { resolveUploadContentType } from '@/lib/firebase/upload-content-type';

export type PreparedUploadFile = {
  uri: string;
  name: string;
  mimeType: string;
};

function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Normalize local files before Storage upload.
 * - Images are re-encoded to JPEG (fixes HEIC / empty mime / picker quirks)
 * - Non-images are copied to a stable file:// cache path when needed
 */
export async function prepareUploadFile(input: {
  uri: string;
  name: string;
  mimeType?: string | null;
}): Promise<PreparedUploadFile> {
  const mimeType = resolveUploadContentType(input.mimeType, input.name);
  const safeName = input.name.replace(/[^a-zA-Z0-9._-]/g, '_') || `upload-${Date.now()}`;

  if (isImageMime(mimeType) && mimeType !== 'image/svg+xml') {
    const manipulated = await ImageManipulator.manipulateAsync(input.uri, [], {
      compress: 0.85,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    return {
      uri: manipulated.uri,
      name: safeName.replace(/\.[^.]+$/, '') + '.jpg',
      mimeType: 'image/jpeg',
    };
  }

  if (input.uri.startsWith('file://')) {
    return { uri: input.uri, name: safeName, mimeType };
  }

  if (input.uri.startsWith('http://') || input.uri.startsWith('https://')) {
    const destination = `${FileSystem.cacheDirectory}upload-${Date.now()}-${safeName}`;
    const downloaded = await FileSystem.downloadAsync(input.uri, destination);
    return { uri: downloaded.uri, name: safeName, mimeType };
  }

  const destination = `${FileSystem.cacheDirectory}upload-${Date.now()}-${safeName}`;
  await FileSystem.copyAsync({ from: input.uri, to: destination });
  return { uri: destination, name: safeName, mimeType };
}
