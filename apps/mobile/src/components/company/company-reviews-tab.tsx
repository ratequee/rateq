import { CompanyReviewQuoteCard } from '@/components/company/company-review-quote-card';
import { Input } from '@/components/ui/input';
import { getFontFamily } from '@/i18n';
import { cn } from '@/lib/cn';
import type { ReviewPublic } from '@rateq/types';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

interface CompanyReviewsTabProps {
  reviews: ReviewPublic[];
  topMentions: string[];
}

export function CompanyReviewsTab({ reviews, topMentions }: CompanyReviewsTabProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [activeMention, setActiveMention] = useState<string | null>(null);

  const filteredReviews = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return reviews.filter((review) => {
      const matchesQuery =
        !normalizedQuery ||
        review.content.toLowerCase().includes(normalizedQuery) ||
        review.title.toLowerCase().includes(normalizedQuery);

      const matchesMention =
        !activeMention ||
        review.title.toLowerCase().includes(activeMention.toLowerCase()) ||
        review.content.toLowerCase().includes(activeMention.toLowerCase());

      return matchesQuery && matchesMention;
    });
  }, [reviews, query, activeMention]);

  return (
    <View>
      <View className="relative">
        <Input
          className="rounded-full border-slate-200 bg-white pe-12 ps-11"
          placeholder={t('company.searchReviews')}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        <View className="pointer-events-none absolute left-4 top-0 h-12 justify-center">
          <Ionicons name="search" size={18} color="#94a3b8" />
        </View>
      </View>

      {topMentions.length > 0 ? (
        <View className="mt-5">
          <Text
            className="text-base font-bold text-ink dark:text-white"
            style={{ fontFamily: getFontFamily('bold') }}
          >
            {t('company.topMentions')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3"
            contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
          >
            {topMentions.map((mention) => {
              const active = activeMention === mention;
              return (
                <Pressable
                  key={mention}
                  onPress={() => setActiveMention(active ? null : mention)}
                  className={cn(
                    'rounded-full px-4 py-2',
                    active
                      ? 'bg-brand-500'
                      : 'border border-slate-200 bg-slate-100 dark:border-dm-border dark:bg-dm-elevated',
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm font-medium',
                      active ? 'text-white' : 'text-ink dark:text-white',
                    )}
                    style={{ fontFamily: getFontFamily('medium') }}
                  >
                    {mention}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <View className="mt-6">
        {filteredReviews.length === 0 ? (
          <Text
            className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-sm text-ink-muted dark:border-dm-border dark:text-white/70"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {reviews.length === 0 ? t('company.noReviews') : t('company.noReviewResults')}
          </Text>
        ) : (
          filteredReviews.map((review) => (
            <CompanyReviewQuoteCard key={review.id} review={review} />
          ))
        )}
      </View>
    </View>
  );
}
