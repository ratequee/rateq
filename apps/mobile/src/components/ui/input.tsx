import { forwardRef, useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/lib/cn';
import { getFontFamily } from '@/i18n';
import { useAppDirection } from '@/hooks/use-app-direction';
import { useTheme } from '@/context/theme-context';

export const Input = forwardRef<TextInput, TextInputProps & { className?: string }>(function Input(
  { className, style, multiline, ...props },
  ref,
) {
  const { textStyle, textAlignClass } = useAppDirection();
  return (
    <TextInput
      ref={ref}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      className={cn(
        'rounded-xl border border-slate-200 bg-white px-4 text-base text-ink dark:border-dm-border dark:bg-dm-elevated dark:text-white',
        multiline ? 'min-h-[88px] py-3' : 'h-12',
        textAlignClass,
        className,
      )}
      placeholderTextColor="#9ca3af"
      style={[
        { fontFamily: getFontFamily('regular') },
        textStyle,
        multiline ? { minHeight: 88 } : null,
        style,
      ]}
      {...props}
    />
  );
});

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  className?: string;
  toggleLabels: { show: string; hide: string };
}

export function PasswordInput({ className, toggleLabels, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const { resolved } = useTheme();

  return (
    <View className="relative">
      <Input
        className={cn('pe-12', className)}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={visible ? toggleLabels.hide : toggleLabels.show}
        onPress={() => setVisible((v) => !v)}
        className="absolute end-0 top-0 h-12 w-12 items-center justify-center"
      >
        <Ionicons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color={resolved === 'dark' ? '#d1d5db' : '#6b7280'}
        />
      </Pressable>
    </View>
  );
}
