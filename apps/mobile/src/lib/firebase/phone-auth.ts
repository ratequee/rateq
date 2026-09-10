import { PhoneAuthProvider, linkWithCredential, reload, updatePhoneNumber } from 'firebase/auth';
import {
  getAuth as getNativeAuth,
  verifyPhoneNumber as nativeVerifyPhoneNumber,
} from '@react-native-firebase/auth';
import { formatQatarPhoneForSubmit, isValidQatarPhoneDigits } from '@/lib/qatar-phone';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { ensureFirebaseUser } from '@/lib/firebase/ensure-user';

type PhoneVerificationMode = 'link' | 'update';

let verificationId: string | null = null;
let activeMode: PhoneVerificationMode | null = null;
let autoVerificationCode: string | null = null;

const NATIVE_AUTO_VERIFY_TIMEOUT_SECONDS = 60;

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

  if (refreshedUser.phoneNumber && isSamePhoneNumber(refreshedUser.phoneNumber, normalizedPhone)) {
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

  if (!verificationId || !activeMode) {
    throw new Error('No phone verification in progress. Request a new code.');
  }

  const credential = PhoneAuthProvider.credential(verificationId, code);

  if (activeMode === 'update') {
    await updatePhoneNumber(user, credential);
  } else {
    try {
      await linkWithCredential(user, credential);
    } catch (error) {
      // Phone may already be linked to this same user after a prior successful attempt.
      await reload(user);
      if (auth.currentUser?.phoneNumber) {
        // Already linked on this account (retry / partial success).
        clearPhoneVerificationState();
        return;
      }
      throw error;
    }
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
