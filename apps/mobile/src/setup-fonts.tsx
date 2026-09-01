import { resolveTextFontStyle } from '@/lib/resolve-text-font';
import React from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
} from 'react-native';

type TextLikeProps = TextProps & { className?: string };
type TextInputLikeProps = TextInputProps & { className?: string };

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

// Apply before app screens import Text from react-native.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const reactNative = require('react-native') as any;
reactNative.Text = PatchedText;
reactNative.TextInput = PatchedTextInput;
