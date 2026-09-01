import { useTheme } from '@/context/theme-context';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

const GOLD_LIGHT = '#f5ddb3';
const GOLD_FILLED = '#edc56f';
const GOLD_DEEP = '#d4a017';

const STAR_PATH =
  'M12 2.35 14.47 8.1l6.28.91-4.54 4.43 1.07 6.25L12 16.77 6.72 19.69l1.07-6.25L3.25 9.01l6.28-.91L12 2.35Z';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}

function clampFill(value: number, star: number): number {
  return Math.min(1, Math.max(0, value - (star - 1)));
}

function StarGlyph({
  size,
  fillPercent,
  gradientId,
  emptyStroke,
  emptyFill,
  emphasized,
}: {
  size: number;
  fillPercent: number;
  gradientId: string;
  emptyStroke: string;
  emptyFill: string;
  emphasized?: boolean;
}) {
  const clipWidth = 24 * fillPercent;
  const hasFill = fillPercent > 0;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {hasFill ? (
        <Defs>
          <LinearGradient id={gradientId} x1="4" y1="3" x2="20" y2="21">
            <Stop offset="0%" stopColor={GOLD_LIGHT} />
            <Stop offset="45%" stopColor={GOLD_FILLED} />
            <Stop offset="100%" stopColor={GOLD_DEEP} />
          </LinearGradient>
          <ClipPath id={`${gradientId}-clip`}>
            <Rect x="0" y="0" width={clipWidth} height="24" />
          </ClipPath>
        </Defs>
      ) : null}

      <Path
        d={STAR_PATH}
        fill={emptyFill}
        stroke={emptyStroke}
        strokeWidth={emphasized ? 1.35 : 1.15}
        strokeLinejoin="round"
      />

      {hasFill ? (
        <G clipPath={`url(#${gradientId}-clip)`}>
          <Path
            d={STAR_PATH}
            fill={`url(#${gradientId})`}
            stroke={GOLD_DEEP}
            strokeWidth={0.75}
            strokeLinejoin="round"
          />
        </G>
      ) : null}
    </Svg>
  );
}

export function StarRating({ value, onChange, size = 20 }: StarRatingProps) {
  const { resolved } = useTheme();
  const isDark = resolved === 'dark';
  const interactive = Boolean(onChange);
  const [pressedStar, setPressedStar] = useState<number | null>(null);

  const emptyStroke = isDark ? '#6b7280' : '#d1d5db';
  const emptyFill = isDark ? '#404040' : '#f8fafc';
  const gap = Math.max(2, Math.round(size * 0.12));

  const handlePress = useCallback(
    (star: number) => {
      onChange?.(star);
    },
    [onChange],
  );

  return (
    <View
      className="flex-row items-center"
      style={{ gap }}
      accessibilityRole={interactive ? 'adjustable' : 'image'}
      accessibilityLabel={interactive ? undefined : `${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fillPercent = interactive ? (star <= value ? 1 : 0) : clampFill(value, star);
        const emphasized = interactive && (pressedStar === star || star <= value);
        const glyph = (
          <StarGlyph
            size={size}
            fillPercent={fillPercent}
            gradientId={`rateq-star-${star}`}
            emptyStroke={emptyStroke}
            emptyFill={emptyFill}
            emphasized={emphasized}
          />
        );

        if (!interactive) {
          return (
            <View key={star} accessibilityElementsHidden importantForAccessibility="no">
              {glyph}
            </View>
          );
        }

        return (
          <Pressable
            key={star}
            onPress={() => handlePress(star)}
            onPressIn={() => setPressedStar(star)}
            onPressOut={() => setPressedStar(null)}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${star} out of 5`}
            hitSlop={6}
            style={({ pressed }) => ({
              transform: [{ scale: pressed || pressedStar === star ? 1.12 : 1 }],
              opacity: pressed ? 0.92 : 1,
            })}
          >
            {glyph}
          </Pressable>
        );
      })}
    </View>
  );
}
