import { getFontFamily } from '@/i18n';
import { cn } from '@/lib/cn';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/theme-context';

type TabIconName = keyof typeof Ionicons.glyphMap;

interface TabItemConfig {
  routeName: string;
  icon: TabIconName;
  activeIcon?: TabIconName;
}

const TAB_ITEMS: TabItemConfig[] = [
  { routeName: 'map', icon: 'location-outline', activeIcon: 'location' },
  { routeName: 'companies', icon: 'business-outline', activeIcon: 'business' },
  { routeName: 'index', icon: 'home-outline', activeIcon: 'home' },
];

/** Browse-only guest tabs — no Activity / Profile. */
export function GuestTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { resolved } = useTheme();
  const isDark = resolved === 'dark';

  return (
    <View
      className={cn('border-t border-slate-200 bg-white dark:border-dm-border dark:bg-dm-surface')}
      style={{ paddingBottom: Math.max(insets.bottom, 8), paddingTop: 8 }}
    >
      <View className="flex-row items-center justify-between px-2">
        {state.routes.map((route, index) => {
          const config = TAB_ITEMS.find((item) => item.routeName === route.name);
          if (!config) return null;

          const isFocused = state.index === index;
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const color = isFocused ? '#8E2157' : isDark ? '#9ca3af' : '#64748b';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={label}
              onPress={onPress}
              className="min-w-[64px] flex-1 items-center px-1 py-1"
            >
              <Ionicons
                name={isFocused && config.activeIcon ? config.activeIcon : config.icon}
                size={22}
                color={color}
              />
              <Text
                className="mt-1 text-center text-[11px]"
                style={{
                  fontFamily: getFontFamily(isFocused ? 'semibold' : 'regular'),
                  color,
                }}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
