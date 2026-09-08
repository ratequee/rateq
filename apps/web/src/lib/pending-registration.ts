const STORAGE_KEY = 'rateq_pending_registration';

export interface PendingRegistration {
  name: string;
  email: string;
  phone: string;
  phoneVerified: boolean;
}

export function savePendingRegistration(data: PendingRegistration): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getPendingRegistration(): PendingRegistration | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingRegistration;
    if (!parsed?.email || !parsed?.phone) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingRegistration(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function markPendingPhoneVerified(phone: string): void {
  const pending = getPendingRegistration();
  if (!pending) {
    savePendingRegistration({
      name: '',
      email: '',
      phone,
      phoneVerified: true,
    });
    return;
  }
  savePendingRegistration({
    ...pending,
    phone,
    phoneVerified: true,
  });
}
