import { getFirebaseApp, getFirebaseAuth } from '@/lib/firebase/client';
import { ensureFirebaseUserForUpload } from '@/lib/firebase/ensure-user';
import { prepareUploadFile } from '@/lib/firebase/prepare-upload-file';
import { resolveUploadContentType } from '@/lib/firebase/upload-content-type';
import { MAX_PROFILE_FILE_BYTES } from '@/lib/validation/profile-fields';
import { FirebaseError } from 'firebase/app';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

const UPLOAD_TIMEOUT_MS = 90_000;

function getFirebaseStorage() {
  return getStorage(getFirebaseApp());
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

/**
 * Convert a local file URI into a Blob for the official Firebase Storage API.
 * React Native has no File input; XHR is the supported way to obtain a Blob
 * from a file:// / content:// / ph:// URI for uploadBytes().
 *
 * @see https://firebase.google.com/docs/storage/web/upload-files
 */
function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      const response = xhr.response;
      if (response instanceof Blob) {
        resolve(response);
        return;
      }
      reject(new Error('Could not read the selected file as a Blob.'));
    };
    xhr.onerror = () => {
      reject(new Error('Could not read the selected file. Please pick it again.'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

function mapStorageError(error: unknown): Error {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'storage/unauthorized':
        return new Error(
          'Permission denied. Sign in again, then upload a JPG, PNG, or PDF under 10 MB.',
        );
      case 'storage/canceled':
        return new Error('Upload was canceled.');
      case 'storage/retry-limit-exceeded':
        return new Error('Upload failed after several retries. Check your connection.');
      case 'storage/quota-exceeded':
        return new Error('Storage quota exceeded.');
      default:
        return new Error(error.message || 'Upload failed.');
    }
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('Upload failed.');
}

/**
 * Official Firebase Storage upload:
 * 1) ensure Auth currentUser
 * 2) Blob from local URI
 * 3) uploadBytes(ref, blob, metadata)
 * 4) getDownloadURL(snapshot.ref)
 *
 * Same pattern as web (`apps/web/src/lib/firebase/storage.ts`) and
 * https://firebase.google.com/docs/storage/web/upload-files
 */
async function uploadUserFileInternal(
  folder: string,
  uri: string,
  fileName: string,
  contentType: string,
): Promise<string> {
  const firebaseUser = await ensureFirebaseUserForUpload();

  // Storage rules use request.auth.uid — must match the path below.
  if (!getFirebaseAuth().currentUser) {
    throw new Error('You must be signed in to upload files');
  }

  const prepared = await prepareUploadFile({
    uri,
    name: fileName,
    mimeType: contentType,
  });

  const blob = await uriToBlob(prepared.uri);

  if (blob.size <= 0) {
    throw new Error('Selected file appears to be empty. Please pick another file.');
  }
  if (blob.size > MAX_PROFILE_FILE_BYTES) {
    throw new Error('File must be 10 MB or smaller.');
  }

  const safeName = prepared.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const objectPath = `users/${firebaseUser.uid}/${folder}/${Date.now()}-${safeName}`;
  const metadata = {
    contentType: resolveUploadContentType(prepared.mimeType, prepared.name),
  };

  const storageRef = ref(getFirebaseStorage(), objectPath);

  try {
    const snapshot = await uploadBytes(storageRef, blob, metadata);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    throw mapStorageError(error);
  } finally {
    // Free native memory when available (RN Blob).
    const closable = blob as Blob & { close?: () => void };
    closable.close?.();
  }
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
