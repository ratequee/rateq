import {
  OAuthProvider,
  signInWithCredential,
  updateProfile,
  type UserCredential,
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { throwIfAccountLinkingRequired } from '@/lib/firebase/account-linking';

function buildDisplayName(
  fullName: AppleAuthentication.AppleAuthenticationFullName | null,
): string | undefined {
  if (!fullName) return undefined;
  const parts = [fullName.givenName, fullName.familyName].filter(Boolean);
  const name = parts.join(' ').trim();
  return name || undefined;
}

export async function firebaseSignInWithApple(): Promise<UserCredential> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign In is only available on iOS');
  }

  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!appleCredential.identityToken) {
    throw new Error('Apple Sign In did not return an identity token');
  }

  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken: appleCredential.identityToken,
    rawNonce,
  });

  let userCredential: UserCredential;
  try {
    userCredential = await signInWithCredential(getFirebaseAuth(), credential);
  } catch (error) {
    await throwIfAccountLinkingRequired(error, 'Apple');
    throw error;
  }

  const displayName = buildDisplayName(appleCredential.fullName);
  if (displayName && !userCredential.user.displayName) {
    await updateProfile(userCredential.user, { displayName });
  }

  return userCredential;
}
