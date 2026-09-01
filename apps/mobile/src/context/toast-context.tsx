import { getFontFamily } from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastOptions {
  variant?: ToastVariant;
  title?: string;
  message: string;
  durationMs?: number;
}

interface ToastItem extends Required<Pick<ToastOptions, 'message'>> {
  id: string;
  variant: ToastVariant;
  title?: string;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<
  ToastVariant,
  { icon: keyof typeof Ionicons.glyphMap; iconColor: string; accent: string; surface: string }
> = {
  success: {
    icon: 'checkmark-circle',
    iconColor: '#059669',
    accent: '#edc56f',
    surface: 'bg-white dark:bg-dm-surface',
  },
  error: {
    icon: 'alert-circle',
    iconColor: '#dc2626',
    accent: '#f87171',
    surface: 'bg-white dark:bg-dm-surface',
  },
  info: {
    icon: 'information-circle',
    iconColor: '#8E2157',
    accent: '#edc56f',
    surface: 'bg-white dark:bg-dm-surface',
  },
};

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const style = VARIANT_STYLES[toast.variant];

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).stiffness(220)}
      exiting={FadeOutUp.duration(180)}
      layout={LinearTransition.springify()}
      className={`overflow-hidden rounded-2xl border border-slate-200 shadow-lg dark:border-dm-border ${style.surface}`}
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
      }}
    >
      <View className="h-1" style={{ backgroundColor: style.accent }} />
      <View className="flex-row items-start gap-3 px-4 py-3.5">
        <View
          className="mt-0.5 h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: `${style.iconColor}18` }}
        >
          <Ionicons name={style.icon} size={20} color={style.iconColor} />
        </View>
        <View className="min-w-0 flex-1">
          {toast.title ? (
            <Text
              className="text-sm font-semibold text-ink dark:text-white"
              style={{ fontFamily: getFontFamily('semibold') }}
            >
              {toast.title}
            </Text>
          ) : null}
          <Text
            className={`text-sm leading-5 text-ink/85 dark:text-white/85 ${toast.title ? 'mt-0.5' : ''}`}
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {toast.message}
          </Text>
        </View>
        <Pressable
          onPress={() => onDismiss(toast.id)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          className="h-7 w-7 items-center justify-center rounded-full"
        >
          <Ionicons name="close" size={16} color="#94a3b8" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

function ToastHost({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 z-50 px-4"
      style={{ top: insets.top + 8 }}
    >
      <View className="gap-2">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </View>
    </View>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ variant = 'info', title, message, durationMs = 3200 }: ToastOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const item: ToastItem = { id, variant, title, message };

      setToasts((current) => [...current.slice(-2), item]);

      const timer = setTimeout(() => dismiss(id), durationMs);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      showToast,
      showSuccess: (message: string, title?: string) =>
        showToast({ variant: 'success', message, title }),
      showError: (message: string, title?: string) =>
        showToast({ variant: 'error', message, title }),
      showInfo: (message: string, title?: string) => showToast({ variant: 'info', message, title }),
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastHost toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
