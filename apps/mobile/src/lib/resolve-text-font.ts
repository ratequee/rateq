import {
  classNameToAppWeight,
  fontWeightToAppWeight,
  getFontFamilyForLocale,
  getFontFamilyForText,
  type AppFontWeight,
} from '@/lib/fonts';
import { getCurrentLocale } from '@/i18n';
import React from 'react';
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';

function extractText(children: React.ReactNode): string {
  if (children == null || typeof children === 'boolean') return '';
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (React.isValidElement(children)) {
    return extractText((children.props as { children?: React.ReactNode }).children);
  }
  return '';
}

function resolveWeight(style: StyleProp<TextStyle> | undefined, className?: string): AppFontWeight {
  const flat = StyleSheet.flatten(style);
  if (flat?.fontFamily) return 'regular';

  return fontWeightToAppWeight(flat?.fontWeight) ?? classNameToAppWeight(className) ?? 'regular';
}

export function resolveTextFontStyle(
  style?: StyleProp<TextStyle>,
  className?: string,
  children?: React.ReactNode,
): TextStyle | undefined {
  const flat = StyleSheet.flatten(style);
  if (flat?.fontFamily) return undefined;

  const locale = getCurrentLocale();
  const weight = resolveWeight(style, className);
  const text = extractText(children);
  if (text) {
    return { fontFamily: getFontFamilyForText(text, weight, locale) };
  }
  return { fontFamily: getFontFamilyForLocale(locale, weight) };
}
