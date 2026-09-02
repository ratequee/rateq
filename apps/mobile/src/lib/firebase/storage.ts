import { ensureFirebaseUserForUpload } from '@/lib/firebase/ensure-user';
import { getFirebaseApp, getFirebaseWebConfig } from '@/lib/firebase/client';
import { MAX_PROFILE_FILE_BYTES } from '@/lib/validation/profile-fields';
import * as FileSystem from 'expo-file-system';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

const UPLOAD_TIMEOUT_MS = 90_000;
const FILE_INFO_OPTIONS: FileSystem.InfoOptions = { size: true };

interface FirebaseUploadResponse {
  name: string;
  bucket: string;
  downloadTokens?: string;
  metadata?: {
    firebaseStorageDownloadTokens?: string;
  };
}

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), UPLOAD_TIMEOUT_MS);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function ensureUploadableFileUri(uri: string): Promise<string> {
  if (uri.startsWith('file://')) {
    const fileInfo = await FileSystem.getInfoAsync(uri, FILE_INFO_OPTIONS);
    if (!fileInfo.exists) {
      throw new Error('Selected file is no longer available. Please pick it again.');
    }
    return uri;
  }

  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    const destination = `${FileSystem.cacheDirectory}upload-${Date.now()}`;
    const downloaded = await FileSystem.downloadAsync(uri, destination);
    return downloaded.uri;
  }

  const destination = `${FileSystem.cacheDirectory}upload-${Date.now()}`;
  await FileSystem.copyAsync({ from: uri, to: destination });
  return destination;
}

function getDownloadToken(payload: FirebaseUploadResponse): string | null {
  if (payload.downloadTokens?.trim()) {
    return payload.downloadTokens.split(',')[0]?.trim() ?? null;
  }

  const metadataToken = payload.metadata?.firebaseStorageDownloadTokens;
  if (metadataToken?.trim()) {
    return metadataToken.split(',')[0]?.trim() ?? null;
  }

  return null;
}

function buildDownloadUrl(bucket: string, objectPath: string, token: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(
    objectPath,
  )}?alt=media&token=${token}`;
}

export async function uploadUserImage(
  folder: string,
  uri: string,
  fileName: string,
  contentType = 'image/jpeg',
): Promise<string> {
  return uploadUserFile(folder, uri, fileName, contentType);
}

export async function uploadUserFile(
  folder: string,
  uri: string,
  fileName: string,
  contentType: string,
): Promise<string> {
  return withTimeout(
    uploadUserFileInternal(folder, uri, fileName, contentType),
    'Upload timed out. Check your connection and try again.',
  );
}

function parseUploadErrorBody(body: string, status: number): string {
  try {
    const errBody = JSON.parse(body) as { error?: { message?: string } };
    return errBody.error?.message?.trim() ?? '';
  } catch {
    return body.trim() || `Upload failed (${status}). Please try again.`;
  }
}

function parseUploadPayload(body: string): FirebaseUploadResponse {
  try {
    return JSON.parse(body) as FirebaseUploadResponse;
  } catch {
    throw new Error('Upload response was invalid. Please try again.');
  }
}

async function getValidatedFileSize(fileUri: string): Promise<number> {
  const fileInfo = await FileSystem.getInfoAsync(fileUri, FILE_INFO_OPTIONS);
  if (!fileInfo.exists || typeof fileInfo.size !== 'number') {
    throw new Error('Could not read the selected file. Please pick it again.');
  }
  if (fileInfo.size <= 0) {
    throw new Error('Selected file appears to be empty. Please pick another file.');
  }
  if (fileInfo.size > MAX_PROFILE_FILE_BYTES) {
    throw new Error('File must be 10 MB or smaller.');
  }
  return fileInfo.size;
}

async function startResumableUploadSession(
  storageBucket: string,
  objectPath: string,
  idToken: string,
  contentType: string,
): Promise<string> {
  const sessionUrl =
    `https://firebasestorage.googleapis.com/v0/b/${storageBucket}` +
    `/o?uploadType=resumable&name=${encodeURIComponent(objectPath)}`;

  const response = await fetch(sessionUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Goog-Content-Type': contentType,
    },
    body: '{}',
  });

  if (!response.ok) {
    const detail = parseUploadErrorBody(await response.text(), response.status);
    throw new Error(detail);
  }

  const uploadSessionUrl = response.headers.get('Location');
  if (!uploadSessionUrl) {
    throw new Error('Upload session could not be created. Please try again.');
  }

  return uploadSessionUrl;
}

async function uploadFileToResumableSession(
  uploadSessionUrl: string,
  fileUri: string,
  contentType: string,
  contentLength: number,
): Promise<FirebaseUploadResponse> {
  const response = await FileSystem.uploadAsync(uploadSessionUrl, fileUri, {
    httpMethod: 'PUT',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(contentLength),
    },
    sessionType: FileSystem.FileSystemSessionType.FOREGROUND,
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(parseUploadErrorBody(response.body, response.status));
  }

  return parseUploadPayload(response.body);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function uploadFileWithFirebaseSdk(
  objectPath: string,
  fileUri: string,
  contentType: string,
): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const bytes = base64ToUint8Array(base64);
  const storageRef = ref(getStorage(getFirebaseApp()), objectPath);
  const snapshot = await uploadBytes(storageRef, bytes, { contentType });
  return getDownloadURL(snapshot.ref);
}

async function uploadFileToFirebase(
  storageBucket: string,
  objectPath: string,
  fileUri: string,
  contentType: string,
  idToken: string,
): Promise<FirebaseUploadResponse | string> {
  const contentLength = await getValidatedFileSize(fileUri);

  try {
    const uploadSessionUrl = await startResumableUploadSession(
      storageBucket,
      objectPath,
      idToken,
      contentType,
    );
    return await uploadFileToResumableSession(
      uploadSessionUrl,
      fileUri,
      contentType,
      contentLength,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const shouldFallback =
      message.includes('Message too long') ||
      message.includes('Unable to upload the file') ||
      message.includes('NSPOSIXErrorDomain');

    if (!shouldFallback) {
      throw error;
    }

    return uploadFileWithFirebaseSdk(objectPath, fileUri, contentType);
  }
}

function normalizeContentType(contentType: string, fileName: string): string {
  const trimmed = contentType.trim();
  if (trimmed.includes('/')) return trimmed;

  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

async function uploadUserFileInternal(
  folder: string,
  uri: string,
  fileName: string,
  contentType: string,
): Promise<string> {
  const firebaseUser = await ensureFirebaseUserForUpload();
  const idToken = await firebaseUser.getIdToken();
  const { storageBucket } = getFirebaseWebConfig();

  if (!storageBucket) {
    throw new Error('Firebase storage bucket is not configured.');
  }

  const fileUri = await ensureUploadableFileUri(uri);
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const objectPath = `users/${firebaseUser.uid}/${folder}/${Date.now()}-${safeName}`;
  const normalizedContentType = normalizeContentType(contentType, fileName);
  const uploadResult = await uploadFileToFirebase(
    storageBucket,
    objectPath,
    fileUri,
    normalizedContentType,
    idToken,
  );

  if (typeof uploadResult === 'string') {
    return uploadResult;
  }

  const token = getDownloadToken(uploadResult);

  if (!token) {
    throw new Error('Upload succeeded but download URL could not be created.');
  }

  return buildDownloadUrl(
    uploadResult.bucket || storageBucket,
    uploadResult.name || objectPath,
    token,
  );
}
