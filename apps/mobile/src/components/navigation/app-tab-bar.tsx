import { getFontFamily } from '@/i18n';
import { cn } from '@/lib/cn';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/theme-context';

type TabIconName = keyof typeof Ionicons.glyphMap;

interface TabItemConfig {
  routeName: string;
  labelKey: string;
  icon: TabIconName;
  activeIcon?: TabIconName;
  isCenter?: boolean;
}

const TAB_ITEMS: TabItemConfig[] = [
  { routeName: 'map', labelKey: 'tabs.map', icon: 'location-outline', activeIcon: 'location' },
  {
    routeName: 'companies',
    labelKey: 'tabs.companies',
    icon: 'business-outline',
    activeIcon: 'business',
  },
  { routeName: 'index', labelKey: 'tabs.home', icon: 'home', isCenter: true },
  {
    routeName: 'activity',
    labelKey: 'tabs.activity',
    icon: 'stats-chart-outline',
    activeIcon: 'stats-chart',
  },
  { routeName: 'profile', labelKey: 'tabs.profile', icon: 'person-outline', activeIcon: 'person' },
];

export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { resolved } = useTheme();
  const isDark = resolved === 'dark';

  return (
    <View
      className={cn('border-t border-slate-200 bg-white dark:border-dm-border dark:bg-dm-surface')}
      style={{ paddingBottom: Math.max(insets.bottom, 8), paddingTop: 8 }}
    >
      <View className="flex-row items-end justify-between px-2">
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

          if (config.isCenter) {
            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={label}
                onPress={onPress}
                className="items-center"
                style={{ marginTop: -28, width: 72 }}
              >
                <View
                  className={cn(
                    'h-14 w-14 items-center justify-center rounded-full shadow-lg',
                    isFocused ? 'bg-brand-500' : 'bg-brand-500',
                  )}
                  style={{
                    shadowColor: '#8E2157',
                    shadowOpacity: 0.35,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 8,
                  }}
                >
                  <Ionicons name="home" size={26} color="#ffffff" />
                </View>
              </Pressable>
            );
          }

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
