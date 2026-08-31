import { CompanyProjectsTab } from '@/components/company/company-projects-tab';
import { CompanyReviewsTab } from '@/components/company/company-reviews-tab';
import { CompanyServicesTab } from '@/components/company/company-services-tab';
import { getFontFamily } from '@/i18n';
import { cn } from '@/lib/cn';
import type { CompanyPublic, ReviewPublic } from '@rateq/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

type CompanyTab = 'reviews' | 'projects' | 'services';

interface CompanyContentTabsProps {
  company: CompanyPublic;
  reviews: ReviewPublic[];
  topMentions: string[];
}

export function CompanyContentTabs({ company, reviews, topMentions }: CompanyContentTabsProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<CompanyTab>('reviews');

  const tabs: { id: CompanyTab; label: string }[] = [
    { id: 'reviews', label: t('company.reviews') },
    { id: 'projects', label: t('company.projects') },
    { id: 'services', label: t('company.services') },
  ];

  return (
    <View className="mt-2 overflow-hidden">
      <View className="bg-brand-500 px-4 py-3">
        <View className="flex-row gap-6">
          {tabs.map((tab) => (
            <Pressable key={tab.id} onPress={() => setActiveTab(tab.id)} className="pb-1">
              <Text
                className={cn(
                  'border-b-2 pb-2 text-sm font-semibold',
                  activeTab === tab.id
                    ? 'border-white text-white'
                    : 'border-transparent text-white/55',
                )}
                style={{ fontFamily: getFontFamily('semibold') }}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="bg-white p-4 dark:bg-dm-surface">
        {activeTab === 'reviews' ? (
          <CompanyReviewsTab reviews={reviews} topMentions={topMentions} />
        ) : null}
        {activeTab === 'projects' ? (
          <CompanyProjectsTab companySlug={company.slug} projects={company.projects} />
        ) : null}
        {activeTab === 'services' ? (
          <CompanyServicesTab
            serviceItems={company.serviceItems ?? []}
            activityItems={company.activityItems ?? []}
            services={company.services ?? []}
          />
        ) : null}
      </View>
    </View>
  );
}
