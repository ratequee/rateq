import { ensureFirebaseUserForUpload } from '@/lib/firebase/ensure-user';
import { getFirebaseApp } from '@/lib/firebase/client';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

function getFirebaseStorage() {
  return getStorage(getFirebaseApp());
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
  const firebaseUser = await ensureFirebaseUserForUpload();

  const response = await fetch(uri);
  const blob = await response.blob();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `users/${firebaseUser.uid}/${folder}/${Date.now()}-${safeName}`;
  const storageRef = ref(getFirebaseStorage(), path);
  const snapshot = await uploadBytes(storageRef, blob, { contentType });
  return getDownloadURL(snapshot.ref);
}
