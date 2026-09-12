import { useTranslation } from 'react-i18next';
import type { ViewStyle } from 'react-native';
import { getTextBlockContainerStyle, getTextDirectionStyle, isRtlLocale } from '@/lib/rtl';

export function useAppDirection() {
  const { i18n } = useTranslation();
  const rtl = isRtlLocale(i18n.language);

  const labelContainerStyle: ViewStyle = {
    width: '100%',
    flexDirection: 'row',
    direction: 'ltr',
    justifyContent: rtl ? 'flex-end' : 'flex-start',
  };

  return {
    locale: i18n.language,
    isRtl: rtl,
    textStyle: getTextDirectionStyle(i18n.language),
    textBlockStyle: getTextBlockContainerStyle(),
    // Avoid NativeWind text-right/left — they invert under RtlRoot's direction:rtl.
    textAlignClass: '',
    labelContainerStyle,
  };
}
