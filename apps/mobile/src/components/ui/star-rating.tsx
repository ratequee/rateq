import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}

export function StarRating({ value, onChange, size = 20 }: StarRatingProps) {
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onChange?.(star)} disabled={!onChange}>
          <Ionicons
            name={star <= value ? 'star' : 'star-outline'}
            size={size}
            color={star <= value ? '#fbbf24' : '#cbd5e1'}
          />
        </Pressable>
      ))}
    </View>
  );
}
