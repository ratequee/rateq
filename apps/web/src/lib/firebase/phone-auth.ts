import {
  linkWithPhoneNumber,
  PhoneAuthProvider,
  RecaptchaVerifier,
  updatePhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/client';

type PhoneVerificationMode = 'link' | 'update';

let recaptchaVerifier: RecaptchaVerifier | null = null;
let linkConfirmation: ConfirmationResult | null = null;
let updateVerificationId: string | null = null;
let activeMode: PhoneVerificationMode | null = null;

export function normalizePhoneNumber(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  return `+${digits.replace(/^\+/, '')}`;
}

function clearPhoneVerificationState(): void {
  linkConfirmation = null;
  updateVerificationId = null;
  activeMode = null;
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
}

export async function startFirebasePhoneVerification(
  phone: string,
  containerId: string,
): Promise<{ smsRequired: boolean }> {
  clearPhoneVerificationState();

  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to verify your phone number');
  }

  const normalizedPhone = normalizePhoneNumber(phone);
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
  });

  if (user.phoneNumber && user.phoneNumber !== normalizedPhone) {
    const provider = new PhoneAuthProvider(auth);
    updateVerificationId = await provider.verifyPhoneNumber(normalizedPhone, recaptchaVerifier);
    activeMode = 'update';
    return { smsRequired: true };
  }

  if (user.phoneNumber === normalizedPhone) {
    clearPhoneVerificationState();
    return { smsRequired: false };
  }

  linkConfirmation = await linkWithPhoneNumber(user, normalizedPhone, recaptchaVerifier);
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
    clearPhoneVerificationState();
    return;
  }

  if (activeMode === 'update' && updateVerificationId) {
    const credential = PhoneAuthProvider.credential(updateVerificationId, code);
    await updatePhoneNumber(user, credential);
    clearPhoneVerificationState();
    return;
  }

  throw new Error('No phone verification in progress. Request a new code.');
}

export function resetFirebasePhoneVerification(): void {
  clearPhoneVerificationState();
}
