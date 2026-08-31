import { View, TextInput, type TextInputProps } from 'react-native';
import { cn } from '@/lib/cn';
import { getFontFamily } from '@/i18n';
import { sanitizeQatarPhoneDigits } from '@/lib/qatar-phone';
import { useAppDirection } from '@/hooks/use-app-direction';

interface QatarPhoneInputProps extends Omit<TextInputProps, 'value' | 'onChangeText' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function QatarPhoneInput({ value, onChange, className, ...props }: QatarPhoneInputProps) {
  const { textStyle } = useAppDirection();

  return (
    <View
      className={cn(
        'h-12 flex-row items-center overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-dm-border dark:bg-dm-elevated',
        className,
      )}
    >
      <View className="h-full justify-center border-e border-slate-200 bg-slate-50 px-3 dark:border-dm-border dark:bg-dm-surface">
        <TextInput
          editable={false}
          value="+974"
          className="text-base text-ink dark:text-white"
          style={{ fontFamily: getFontFamily('medium'), ...textStyle }}
        />
      </View>
      <TextInput
        value={value}
        onChangeText={(text) => onChange(sanitizeQatarPhoneDigits(text))}
        keyboardType="number-pad"
        maxLength={8}
        placeholder="55551234"
        placeholderTextColor="#9ca3af"
        className="flex-1 px-3 text-base text-ink dark:text-white"
        style={{ fontFamily: getFontFamily('regular'), ...textStyle }}
        {...props}
      />
    </View>
  );
}
