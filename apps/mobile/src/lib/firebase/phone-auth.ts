import { PhoneAuthProvider, linkWithCredential, reload, updatePhoneNumber } from 'firebase/auth';
import {
  getAuth as getNativeAuth,
  verifyPhoneNumber as nativeVerifyPhoneNumber,
} from '@react-native-firebase/auth';
import { formatQatarPhoneForSubmit, isValidQatarPhoneDigits } from '@/lib/qatar-phone';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { ensureFirebaseUser } from '@/lib/firebase/ensure-user';
import { onboardingApi } from '@/lib/api';

type PhoneVerificationMode = 'link' | 'update';

let verificationId: string | null = null;
let activeMode: PhoneVerificationMode | null = null;
let autoVerificationCode: string | null = null;
let pendingPhone: string | null = null;
let pendingContext: 'reviewer' | 'company' = 'reviewer';

const NATIVE_AUTO_VERIFY_TIMEOUT_SECONDS = 60;

const PHONE_LINK_CONFLICT_CODES = new Set([
  'auth/account-exists-with-different-credential',
  'auth/credential-already-in-use',
  'auth/phone-number-already-exists',
]);

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

function clearPhoneVerificationState(): void {
  verificationId = null;
  activeMode = null;
  autoVerificationCode = null;
  pendingPhone = null;
}

function getFirebaseErrorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  if ('code' in error && typeof (error as { code?: unknown }).code === 'string') {
    return String((error as { code: string }).code);
  }
  const message = 'message' in error ? String((error as { message?: unknown }).message ?? '') : '';
  const match = message.match(/auth\/[a-z0-9-]+/i);
  return match?.[0]?.toLowerCase() ?? '';
}

function isPhoneLinkConflictError(error: unknown): boolean {
  return PHONE_LINK_CONFLICT_CODES.has(getFirebaseErrorCode(error));
}

/**
 * Native Firebase Phone Auth (APNs / Play Integrity / native reCAPTCHA fallback).
 * Returns a verification ID usable with the JS Auth session via PhoneAuthProvider.credential.
 */
function requestNativePhoneVerificationId(phone: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (action: () => void) => {
      if (settled) return;
      settled = true;
      action();
    };

    nativeVerifyPhoneNumber(getNativeAuth(), phone, NATIVE_AUTO_VERIFY_TIMEOUT_SECONDS).on(
      'state_changed',
      (snapshot) => {
        if (snapshot.state === 'error') {
          settle(() => {
            reject(snapshot.error ?? new Error('Phone verification failed'));
          });
          return;
        }

        if (!snapshot.verificationId) return;

        if (snapshot.state === 'verified' && snapshot.code) {
          autoVerificationCode = snapshot.code;
        }

        if (
          snapshot.state === 'sent' ||
          snapshot.state === 'timeout' ||
          snapshot.state === 'verified'
        ) {
          settle(() => resolve(snapshot.verificationId));
        }
      },
      (error) => {
        settle(() => reject(error));
      },
    );
  });
}

async function reclaimPhoneOntoCurrentUser(phone: string): Promise<boolean> {
  try {
    await onboardingApi.claimPhone(phone, 'reviewer');
    await ensureFirebaseUser();
    const auth = getFirebaseAuth();
    if (auth.currentUser) {
      await reload(auth.currentUser);
    }
    return Boolean(
      auth.currentUser?.phoneNumber && isSamePhoneNumber(auth.currentUser.phoneNumber, phone),
    );
  } catch {
    return false;
  }
}

/**
 * Sends SMS via the native Firebase Auth SDK, then confirms against the existing
 * JS Auth session (email/Google/Apple). Web keeps RecaptchaVerifier — do not change it.
 */
export async function startFirebasePhoneVerification(
  phone: string,
): Promise<{ smsRequired: boolean }> {
  clearPhoneVerificationState();

  await ensureFirebaseUser();
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
  pendingPhone = normalizedPhone;

  if (refreshedUser.phoneNumber && isSamePhoneNumber(refreshedUser.phoneNumber, normalizedPhone)) {
    clearPhoneVerificationState();
    return { smsRequired: false };
  }

  activeMode =
    refreshedUser.phoneNumber && !isSamePhoneNumber(refreshedUser.phoneNumber, normalizedPhone)
      ? 'update'
      : 'link';

  verificationId = await requestNativePhoneVerificationId(normalizedPhone);

  if (autoVerificationCode) {
    await confirmFirebasePhoneVerification(autoVerificationCode);
    return { smsRequired: false };
  }

  return { smsRequired: true };
}

export async function confirmFirebasePhoneVerification(code: string): Promise<void> {
  await ensureFirebaseUser();
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to verify your phone number');
  }

  if (!verificationId || !activeMode || !pendingPhone) {
    throw new Error('No phone verification in progress. Request a new code.');
  }

  const phone = pendingPhone;
  const credential = PhoneAuthProvider.credential(verificationId, code);

  try {
    if (activeMode === 'update') {
      await updatePhoneNumber(user, credential);
    } else {
      await linkWithCredential(user, credential);
    }
  } catch (error) {
    await reload(user);
    if (auth.currentUser?.phoneNumber && isSamePhoneNumber(auth.currentUser.phoneNumber, phone)) {
      clearPhoneVerificationState();
      return;
    }

    // OTP was valid, but this phone is already on another Firebase Auth user.
    // Try reclaiming orphans; otherwise surface a clear phone-already-linked error
    // (Firebase often returns the misleading "account exists with different credential" email message).
    if (isPhoneLinkConflictError(error)) {
      const reclaimed = await reclaimPhoneOntoCurrentUser(phone);
      if (reclaimed) {
        clearPhoneVerificationState();
        return;
      }
      clearPhoneVerificationState();
      throw new Error('Phone number is already linked to another account, use another');
    }

    throw error;
  }

  await reload(user);
  clearPhoneVerificationState();
}

export function resetFirebasePhoneVerification(): void {
  clearPhoneVerificationState();
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
