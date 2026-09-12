import { FirebaseError } from 'firebase/app';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { getFirebaseApp, getFirebaseAuth } from '@/lib/firebase/client';
import {
  isFirebaseStoragePermissionError,
  resolveUploadContentType,
} from '@/lib/firebase/upload-content-type';
import { waitForFirebaseUser } from '@/lib/firebase/wait-for-user';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function getFirebaseStorage() {
  return getStorage(getFirebaseApp());
}

function mapStorageError(error: unknown): Error {
  if (isFirebaseStoragePermissionError(error)) {
    return new Error(
      'Permission denied. Sign in again, then upload a JPG, PNG, or WebP under 10 MB. If it keeps failing, publish docs/firebase-storage.rules in Firebase Console → Storage → Rules.',
    );
  }

  if (error instanceof FirebaseError) {
    if (error.code === 'storage/canceled') return new Error('Upload was canceled.');
    if (error.code === 'storage/retry-limit-exceeded') {
      return new Error('Upload failed after several retries. Check your connection.');
    }
    if (error.code === 'storage/quota-exceeded') {
      return new Error('Storage quota exceeded.');
    }
    if (error.code === 'storage/unauthorized' || error.code === 'storage/unauthenticated') {
      return new Error(
        'Permission denied. Sign in again, then upload a JPG, PNG, or WebP under 10 MB.',
      );
    }
    return new Error(error.message || 'Upload failed.');
  }

  if (error instanceof Error) return error;
  return new Error('Upload failed.');
}

/** Upload under `users/{firebaseUid}/...` so Storage rules can match `request.auth.uid`. */
export async function uploadUserFile(
  _rateqUserId: string,
  folder: string,
  file: File,
): Promise<string> {
  const firebaseUser = await waitForFirebaseUser();

  // Prefer a fresh token; fall back to cached if refresh fails (still authenticated).
  try {
    await firebaseUser.getIdToken(true);
  } catch {
    await firebaseUser.getIdToken();
  }

  if (!getFirebaseAuth().currentUser) {
    throw new Error('You must be signed in to upload files');
  }

  if (file.size <= 0) {
    throw new Error('Selected file appears to be empty. Please pick another file.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('File must be 10 MB or smaller.');
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const contentType = resolveUploadContentType(file.type, file.name);
  // Browsers often leave File.type empty; Storage rules require image/* and reject missing MIME.
  const uploadFile =
    file.type === contentType ? file : new File([file], safeName, { type: contentType });

  const path = `users/${firebaseUser.uid}/${folder}/${Date.now()}-${safeName}`;
  const storageRef = ref(getFirebaseStorage(), path);

  try {
    const snapshot = await uploadBytes(storageRef, uploadFile, { contentType });
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    throw mapStorageError(error);
  }
}
