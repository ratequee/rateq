import { resolveTextFontStyle } from '@/lib/resolve-text-font';
import React from 'react';
import type { TextInputProps, TextProps } from 'react-native';

type TextLikeProps = TextProps & { className?: string };
type TextInputLikeProps = TextInputProps & { className?: string };

/**
 * Load the real components from their library paths.
 * Importing `{ Text }` from `react-native` creates a live binding to the
 * public export — after we patch that export, wrapping would recurse forever
 * and crash Expo Go with a black screen / silent exit.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RNText = require('react-native/Libraries/Text/Text')
  .default as React.ComponentType<TextLikeProps>;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RNTextInput = require('react-native/Libraries/Components/TextInput/TextInput')
  .default as React.ComponentType<TextInputLikeProps>;

function PatchedText({ style, className, children, ...props }: TextLikeProps) {
  const fontStyle = resolveTextFontStyle(style, className, children);
  return (
    <RNText {...props} className={className} style={[fontStyle, style]}>
      {children}
    </RNText>
  );
}

function PatchedTextInput({ style, className, ...props }: TextInputLikeProps) {
  const fontStyle = resolveTextFontStyle(style, className, props.value ?? props.placeholder);
  return <RNTextInput {...props} className={className} style={[fontStyle, style]} />;
}

PatchedText.displayName = 'Text';
PatchedTextInput.displayName = 'TextInput';

function patchReactNativeExport(key: 'Text' | 'TextInput', value: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports
  const reactNative = require('react-native') as any;
  Object.defineProperty(reactNative, key, {
    configurable: true,
    enumerable: true,
    writable: true,
    value,
  });
}

// Apply before app screens import Text from react-native.
patchReactNativeExport('Text', PatchedText);
patchReactNativeExport('TextInput', PatchedTextInput);
