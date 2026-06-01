import type { ReviewPublic } from '@rateq/types';
import { View, Text } from 'react-native';
import { StarRating } from '@/components/ui/star-rating';

interface ReviewCardProps {
  review: ReviewPublic;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <View className="mb-3 rounded-xl border border-slate-200 bg-white p-4">
      <View className="flex-row items-center justify-between">
        <StarRating value={review.rating} size={14} />
        <Text className="text-xs text-slate-400">{review.status}</Text>
      </View>
      <Text className="mt-2 font-medium text-slate-900">{review.title}</Text>
      <Text className="mt-1 text-sm leading-5 text-slate-600">{review.content}</Text>
      {review.reply && (
        <View className="mt-3 rounded-lg bg-slate-50 p-3">
          <Text className="text-xs font-medium text-slate-500">Company response</Text>
          <Text className="mt-1 text-sm text-slate-700">{review.reply.content}</Text>
        </View>
      )}
    </View>
  );
}
