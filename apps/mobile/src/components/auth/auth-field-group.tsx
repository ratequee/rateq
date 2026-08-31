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
  return (
    <View>
      <Text
        className="mb-2 text-sm font-medium text-ink dark:text-white"
        style={{ fontFamily: getFontFamily('medium') }}
      >
        {label}
        {required ? <Text className="text-red-500"> *</Text> : null}
      </Text>
      {children}
      {error ? (
        <Text
          className="mt-1.5 text-sm text-red-500"
          style={{ fontFamily: getFontFamily('regular') }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
