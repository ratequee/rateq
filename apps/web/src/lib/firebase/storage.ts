import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getFirebaseApp, getFirebaseAuth } from '@/lib/firebase/client';
import { getStorage } from 'firebase/storage';

function getFirebaseStorage() {
  return getStorage(getFirebaseApp());
}

/** Upload under `users/{firebaseUid}/...` so Storage rules can match `request.auth.uid`. */
export async function uploadUserFile(
  _rateqUserId: string,
  folder: string,
  file: File,
): Promise<string> {
  const firebaseUser = getFirebaseAuth().currentUser;
  if (!firebaseUser) {
    throw new Error('You must be signed in to upload files');
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `users/${firebaseUser.uid}/${folder}/${Date.now()}-${safeName}`;
  const storageRef = ref(getFirebaseStorage(), path);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type || undefined,
  });

  return getDownloadURL(snapshot.ref);
}
