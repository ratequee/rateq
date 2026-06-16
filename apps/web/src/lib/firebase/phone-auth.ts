import {
  GoogleAuthProvider,
  linkWithPhoneNumber,
  PhoneAuthProvider,
  RecaptchaVerifier,
  reauthenticateWithPopup,
  reload,
  updatePhoneNumber,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/client';

type PhoneVerificationMode = 'link' | 'update';

let recaptchaVerifier: RecaptchaVerifier | null = null;
let linkConfirmation: ConfirmationResult | null = null;
let updateVerificationId: string | null = null;
let activeMode: PhoneVerificationMode | null = null;

const RECAPTCHA_TEARDOWN_MS = 350;

export function normalizePhoneNumber(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  return `+${digits.replace(/^\+/, '')}`;
}

async function teardownRecaptchaVerifier(): Promise<void> {
  if (!recaptchaVerifier) return;

  const verifier = recaptchaVerifier;
  recaptchaVerifier = null;

  try {
    verifier.clear();
  } catch {
    // Ignore teardown errors after successful verification.
  }

  await new Promise((resolve) => setTimeout(resolve, RECAPTCHA_TEARDOWN_MS));
}

async function clearPhoneVerificationState(): Promise<void> {
  linkConfirmation = null;
  updateVerificationId = null;
  activeMode = null;
  await teardownRecaptchaVerifier();
}

async function createRecaptchaVerifier(containerId: string): Promise<RecaptchaVerifier> {
  const auth = getFirebaseAuth();
  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
  });
  await verifier.render();
  recaptchaVerifier = verifier;
  return verifier;
}

async function ensureRecentLoginForPhoneUpdate(user: User): Promise<void> {
  const usesGoogle = user.providerData.some((provider) => provider.providerId === 'google.com');
  if (!usesGoogle) return;

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'login' });
  await reauthenticateWithPopup(user, provider);
}

export async function startFirebasePhoneVerification(
  phone: string,
  containerId: string,
): Promise<{ smsRequired: boolean }> {
  await clearPhoneVerificationState();

  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to verify your phone number');
  }

  await reload(user);
  const refreshedUser = auth.currentUser;
  if (!refreshedUser) {
    throw new Error('You must be signed in to verify your phone number');
  }

  const normalizedPhone = normalizePhoneNumber(phone);
  const verifier = await createRecaptchaVerifier(containerId);

  if (refreshedUser.phoneNumber && !isSamePhoneNumber(refreshedUser.phoneNumber, normalizedPhone)) {
    await ensureRecentLoginForPhoneUpdate(refreshedUser);
    const provider = new PhoneAuthProvider(auth);
    updateVerificationId = await provider.verifyPhoneNumber(normalizedPhone, verifier);
    activeMode = 'update';
    return { smsRequired: true };
  }

  if (refreshedUser.phoneNumber && isSamePhoneNumber(refreshedUser.phoneNumber, normalizedPhone)) {
    await clearPhoneVerificationState();
    return { smsRequired: false };
  }

  linkConfirmation = await linkWithPhoneNumber(refreshedUser, normalizedPhone, verifier);
  activeMode = 'link';
  return { smsRequired: true };
}

export async function confirmFirebasePhoneVerification(code: string): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to verify your phone number');
  }

  if (activeMode === 'link' && linkConfirmation) {
    await linkConfirmation.confirm(code);
    await reload(user);
    await clearPhoneVerificationState();
    return;
  }

  if (activeMode === 'update' && updateVerificationId) {
    const credential = PhoneAuthProvider.credential(updateVerificationId, code);
    await updatePhoneNumber(user, credential);
    await reload(user);
    await clearPhoneVerificationState();
    return;
  }

  throw new Error('No phone verification in progress. Request a new code.');
}

export function resetFirebasePhoneVerification(): void {
  void clearPhoneVerificationState();
}

export function getLinkedFirebasePhoneNumber(): string | null {
  try {
    const auth = getFirebaseAuth();
    return auth.currentUser?.phoneNumber ?? null;
  } catch {
    return null;
  }
}

export function isSamePhoneNumber(left: string, right: string): boolean {
  return normalizePhoneNumber(left) === normalizePhoneNumber(right);
}
