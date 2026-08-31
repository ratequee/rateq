import {
  linkWithPhoneNumber,
  PhoneAuthProvider,
  reload,
  updatePhoneNumber,
  type ApplicationVerifier,
  type ConfirmationResult,
} from 'firebase/auth';
import { formatQatarPhoneForSubmit, isValidQatarPhoneDigits } from '@/lib/qatar-phone';
import { getFirebaseAuth } from '@/lib/firebase/client';

type PhoneVerificationMode = 'link' | 'update';

let linkConfirmation: ConfirmationResult | null = null;
let updateVerificationId: string | null = null;
let activeMode: PhoneVerificationMode | null = null;

export function normalizePhoneNumber(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');

  if (digits.startsWith('974') && digits.length >= 11) {
    return `+974${digits.slice(3, 11)}`;
  }

  if (isValidQatarPhoneDigits(trimmed) || isValidQatarPhoneDigits(digits)) {
    return formatQatarPhoneForSubmit(digits);
  }

  if (trimmed.startsWith('+')) return trimmed.replace(/[^\d+]/g, '');
  return `+${digits.replace(/^\+/, '')}`;
}

async function clearPhoneVerificationState(): Promise<void> {
  linkConfirmation = null;
  updateVerificationId = null;
  activeMode = null;
}

export async function startFirebasePhoneVerification(
  phone: string,
  verifier: ApplicationVerifier,
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

  if (refreshedUser.phoneNumber && !isSamePhoneNumber(refreshedUser.phoneNumber, normalizedPhone)) {
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
    return getFirebaseAuth().currentUser?.phoneNumber ?? null;
  } catch {
    return null;
  }
}

export function isSamePhoneNumber(left: string, right: string): boolean {
  return normalizePhoneNumber(left) === normalizePhoneNumber(right);
}
