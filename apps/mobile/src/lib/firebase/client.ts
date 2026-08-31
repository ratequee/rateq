import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

function readEnv(key: string): string | undefined {
  return process.env[key];
}

const firebaseConfig = {
  apiKey: readEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: readEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: readEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: readEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
};

export function getFirebaseWebConfig() {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Check EXPO_PUBLIC_FIREBASE_* env vars.');
  }
  return firebaseConfig;
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
  );
}

let authInstance: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Check EXPO_PUBLIC_FIREBASE_* env vars.');
  }

  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    const app = getFirebaseApp();
    try {
      authInstance = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      authInstance = getAuth(app);
    }
  }
  return authInstance;
}
