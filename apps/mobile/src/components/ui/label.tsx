import { Text, View, type TextProps } from 'react-native';
import { cn } from '@/lib/cn';
import { getFontFamily } from '@/i18n';
import { useAppDirection } from '@/hooks/use-app-direction';

interface LabelProps extends TextProps {
  children: string;
  className?: string;
  required?: boolean;
}

export function Label({ children, className, required, style, ...props }: LabelProps) {
  const { isRtl, textStyle, labelContainerStyle } = useAppDirection();

  return (
    <View className="mb-1.5 w-full" style={labelContainerStyle}>
      <Text
        className={cn('text-sm font-medium text-ink dark:text-white', className)}
        style={[{ fontFamily: getFontFamily('medium') }, textStyle, style]}
        {...props}
      >
        {required && isRtl ? '* ' : null}
        {children}
        {required && !isRtl ? ' *' : null}
      </Text>
    </View>
  );
}
