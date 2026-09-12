import { Label } from '@/components/ui/label';
import { useAppDirection } from '@/hooks/use-app-direction';
import { getFontFamily } from '@/i18n';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface AuthFieldGroupProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

export function AuthFieldGroup({ label, required, error, children }: AuthFieldGroupProps) {
  const { textStyle } = useAppDirection();

  return (
    <View>
      <Label required={required}>{label}</Label>
      {children}
      {error ? (
        <Text
          className="mt-1.5 text-sm text-red-500"
          style={[{ fontFamily: getFontFamily('regular') }, textStyle]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
