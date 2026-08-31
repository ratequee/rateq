import { getFontFamily } from '@/i18n';
import { Text, View, type TextStyle } from 'react-native';

interface BilingualTextProps {
  primary: string;
  secondary?: string | null;
  primarySize?: 'sm' | 'base' | 'lg' | 'xl';
  primaryWeight?: 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  primaryWritingDirection?: TextStyle['writingDirection'];
  secondaryWritingDirection?: TextStyle['writingDirection'];
  className?: string;
}

const sizeClasses = {
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

const lineHeights = {
  sm: 20,
  base: 22,
  lg: 26,
  xl: 30,
};

export function BilingualText({
  primary,
  secondary,
  primarySize = 'base',
  primaryWeight = 'semibold',
  align = 'center',
  primaryWritingDirection = 'ltr',
  secondaryWritingDirection = 'rtl',
  className,
}: BilingualTextProps) {
  const showSecondary = Boolean(secondary?.trim() && secondary.trim() !== primary.trim());
  const alignClass =
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

  const weightFamily =
    primaryWeight === 'bold'
      ? getFontFamily('bold')
      : primaryWeight === 'medium'
        ? getFontFamily('medium')
        : getFontFamily('semibold');

  return (
    <View className={className}>
      <Text
        className={`${sizeClasses[primarySize]} text-ink dark:text-white ${alignClass}`}
        style={{
          fontFamily: weightFamily,
          lineHeight: lineHeights[primarySize],
          writingDirection: primaryWritingDirection,
        }}
      >
        {primary}
      </Text>
      {showSecondary ? (
        <Text
          className={`mt-2 text-ink-muted dark:text-white/75 ${alignClass}`}
          style={{
            fontFamily: getFontFamily('regular'),
            fontSize: primarySize === 'xl' ? 15 : 13,
            lineHeight: primarySize === 'xl' ? 24 : 20,
            writingDirection: secondaryWritingDirection,
          }}
        >
          {secondary}
        </Text>
      ) : null}
    </View>
  );
}
