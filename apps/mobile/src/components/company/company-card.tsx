import type { CompanyPublic } from '@rateq/types';
import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { StarRating } from '@/components/ui/star-rating';
import { useTranslation } from 'react-i18next';

interface CompanyCardProps {
  company: CompanyPublic;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const { t } = useTranslation();

  return (
    <Link href={`/company/${company.slug}`} asChild>
      <Pressable className="mb-3 rounded-xl border border-slate-200 bg-white p-4 active:bg-slate-50">
        <Text className="text-lg font-semibold text-slate-900">{company.name}</Text>
        <Text className="mt-1 text-sm text-slate-500">
          {company.city}, {company.country}
        </Text>
        <View className="mt-3 flex-row items-center justify-between">
          <StarRating value={company.ratingAverage} size={16} />
          <Text className="text-sm text-slate-500">
            {company.reviewCount} {t('common.reviews')}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}
