import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingView } from '@/components/ui/loading-view';
import { StarRating } from '@/components/ui/star-rating';
import { useAuth } from '@/context/auth-context';
import { ApiError, reviewsApi } from '@/lib/api';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function SubmitReviewScreen() {
  const { companyId, name } = useLocalSearchParams<{ companyId: string; name?: string }>();
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async () => {
    if (!companyId) return;
    setSubmitting(true);
    try {
      await reviewsApi.submit({
        companyId,
        rating,
        title: title.trim(),
        content: content.trim(),
      });
      Alert.alert(t('review.success'), '', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof ApiError ? err.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !user) return <LoadingView />;

  return (
    <>
      <Stack.Screen options={{ title: name ?? t('review.submit') }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-slate-50"
      >
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View className="gap-4">
            <View>
              <Text className="mb-2 text-sm font-medium">{t('review.rating')}</Text>
              <StarRating value={rating} onChange={setRating} size={28} />
            </View>
            <View>
              <Text className="mb-1 text-sm font-medium">{t('review.title')}</Text>
              <Input value={title} onChangeText={setTitle} />
            </View>
            <View>
              <Text className="mb-1 text-sm font-medium">{t('review.content')}</Text>
              <TextInput
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={5}
                className="min-h-[120px] rounded-lg border border-slate-300 bg-white p-3 text-base text-slate-900"
                textAlignVertical="top"
              />
            </View>
            <Button title={t('review.submit')} onPress={handleSubmit} loading={submitting} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
