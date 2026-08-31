import type { ReactNode } from 'react';
import { getLayoutDirectionStyle } from '@/lib/rtl';
import { useTranslation } from 'react-i18next';
import { View, type ViewProps } from 'react-native';

interface RtlRootProps extends ViewProps {
  children: ReactNode;
}

export function RtlRoot({ children, style, ...props }: RtlRootProps) {
  const { i18n } = useTranslation();

  return (
    <View style={[getLayoutDirectionStyle(i18n.language), style]} {...props}>
      {children}
    </View>
  );
}
