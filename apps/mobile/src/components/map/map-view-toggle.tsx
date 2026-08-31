import { getFontFamily } from '@/i18n';
import { cn } from '@/lib/cn';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export type MapScreenView = 'map' | 'list';

interface MapViewToggleProps {
  value: MapScreenView;
  onChange: (value: MapScreenView) => void;
}

export function MapViewToggle({ value, onChange }: MapViewToggleProps) {
  const { t } = useTranslation();

  return (
    <View className="bg-brand-600 px-4 pb-4 pt-3 dark:bg-brand-700">
      <View className="mx-auto w-full max-w-md flex-row rounded-full bg-brand-500/60 p-1">
        <Pressable
          onPress={() => onChange('map')}
          className={cn(
            'flex-1 items-center rounded-full py-2.5',
            value === 'map' ? 'bg-brand-900' : 'bg-transparent',
          )}
        >
          <Text
            className={cn(
              'text-sm font-semibold',
              value === 'map' ? 'text-white' : 'text-white/85',
            )}
            style={{ fontFamily: getFontFamily('semibold') }}
          >
            {t('map.viewMap')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onChange('list')}
          className={cn(
            'flex-1 items-center rounded-full py-2.5',
            value === 'list' ? 'bg-brand-900' : 'bg-transparent',
          )}
        >
          <Text
            className={cn(
              'text-sm font-semibold',
              value === 'list' ? 'text-white' : 'text-white/85',
            )}
            style={{ fontFamily: getFontFamily('semibold') }}
          >
            {t('map.viewList')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
