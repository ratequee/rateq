import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'rateq_pending_registration';

export interface PendingRegistration {
  name: string;
  email: string;
  phone: string;
  phoneVerified: boolean;
}

export async function savePendingRegistration(data: PendingRegistration): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function getPendingRegistration(): Promise<PendingRegistration | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingRegistration;
    if (!parsed?.email || !parsed?.phone) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearPendingRegistration(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function markPendingPhoneVerified(phone: string): Promise<void> {
  const pending = await getPendingRegistration();
  if (!pending) {
    await savePendingRegistration({
      name: '',
      email: '',
      phone,
      phoneVerified: true,
    });
    return;
  }
  await savePendingRegistration({
    ...pending,
    phone,
    phoneVerified: true,
  });
}
