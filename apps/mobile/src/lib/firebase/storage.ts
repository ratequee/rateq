import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getStorage } from 'firebase/storage';
import { getFirebaseApp, getFirebaseAuth } from '@/lib/firebase/client';

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
  const firebaseUser = getFirebaseAuth().currentUser;
  if (!firebaseUser) {
    throw new Error('You must be signed in to upload files');
  }

  const response = await fetch(uri);
  const blob = await response.blob();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `users/${firebaseUser.uid}/${folder}/${Date.now()}-${safeName}`;
  const storageRef = ref(getFirebaseStorage(), path);
  const snapshot = await uploadBytes(storageRef, blob, { contentType });
  return getDownloadURL(snapshot.ref);
}
