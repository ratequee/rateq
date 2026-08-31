import { CompanySocialLinksRow } from '@/components/company/company-social-links-row';
import { BilingualText } from '@/components/ui/bilingual-text';
import { getCurrentLocale, getFontFamily } from '@/i18n';
import type { CompanyPublic } from '@rateq/types';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, Text, View } from 'react-native';

interface CompanySummarySectionProps {
  company: CompanyPublic;
  displayName: string;
  secondaryName: string | null;
  description: string | null;
}

function openWebsite(url: string) {
  const href = url.startsWith('http') ? url : `https://${url}`;
  void Linking.openURL(href);
}

function formatWebsiteLabel(url: string): string {
  try {
    const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function CompanySummarySection({
  company,
  displayName,
  secondaryName,
  description,
}: CompanySummarySectionProps) {
  const { t } = useTranslation();
  const isArabic = getCurrentLocale() === 'ar';

  const hasPhone = Boolean(company.phone?.trim());
  const hasEmail = Boolean(company.email?.trim());
  const hasWebsite = Boolean(company.websiteUrl?.trim());

  return (
    <View className="px-4 pb-6">
      <View className="min-h-[72px] justify-center px-1">
        <BilingualText
          primary={displayName}
          secondary={secondaryName}
          primarySize="xl"
          primaryWeight="bold"
          align="center"
          primaryWritingDirection={isArabic ? 'rtl' : 'ltr'}
          secondaryWritingDirection={isArabic ? 'ltr' : 'rtl'}
        />
      </View>

      <View className="mt-4 flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="star" size={16} color="#fbbf24" />
          <Text
            className="text-sm font-bold text-ink dark:text-white"
            style={{ fontFamily: getFontFamily('bold') }}
          >
            {company.ratingAverage.toFixed(1)}
          </Text>
          <Text
            className="text-sm text-ink-muted dark:text-white/70"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            ({t('company.reviewCount', { count: company.reviewCount })})
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="location-outline" size={16} color="#64748b" />
          <Text
            className="text-sm text-ink-muted dark:text-white/70"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {company.city} - {company.country}
          </Text>
        </View>
      </View>

      {hasPhone || hasEmail ? (
        <View className="mt-5 flex-row items-stretch gap-2">
          {hasPhone ? (
            <Pressable
              onPress={() => void Linking.openURL(`tel:${company.phone!.replace(/\s/g, '')}`)}
              className="min-w-0 flex-1 flex-row items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 dark:border-dm-border dark:bg-dm-elevated"
            >
              <Ionicons name="call-outline" size={18} color="#8E2157" />
              <Text
                className="flex-1 text-xs text-ink dark:text-white"
                style={{ fontFamily: getFontFamily('regular'), lineHeight: 18 }}
                numberOfLines={2}
              >
                {company.phone}
              </Text>
            </Pressable>
          ) : null}

          {hasPhone && hasEmail ? (
            <View className="w-px self-stretch bg-slate-200 dark:bg-dm-border" />
          ) : null}

          {hasEmail ? (
            <Pressable
              onPress={() => void Linking.openURL(`mailto:${company.email}`)}
              className="min-w-0 flex-1 flex-row items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 dark:border-dm-border dark:bg-dm-elevated"
            >
              <Ionicons name="mail-outline" size={18} color="#8E2157" />
              <Text
                className="flex-1 text-xs text-ink dark:text-white"
                style={{ fontFamily: getFontFamily('regular'), lineHeight: 18 }}
                numberOfLines={2}
              >
                {company.email}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {hasWebsite ? (
        <Pressable
          onPress={() => openWebsite(company.websiteUrl!)}
          className="mt-3 flex-row items-center justify-center gap-2 self-center rounded-full border border-brand-100 bg-brand-50 px-4 py-2.5 dark:border-brand-900/40 dark:bg-brand-950/20"
        >
          <Ionicons name="globe-outline" size={16} color="#8E2157" />
          <Text
            className="text-sm font-medium text-brand-500"
            style={{ fontFamily: getFontFamily('medium'), lineHeight: 20 }}
          >
            {t('company.visitWebsite')}
          </Text>
          <Text
            className="max-w-[140px] text-sm text-ink-muted dark:text-white/70"
            style={{ fontFamily: getFontFamily('regular'), lineHeight: 20 }}
            numberOfLines={1}
          >
            ({formatWebsiteLabel(company.websiteUrl!)})
          </Text>
        </Pressable>
      ) : null}

      <CompanySocialLinksRow socialLinks={company.socialLinks} />

      {description ? (
        <View className="mt-6 border-t border-slate-100 pt-6 dark:border-dm-border">
          <Text
            className="text-lg font-bold text-ink dark:text-white"
            style={{ fontFamily: getFontFamily('bold'), lineHeight: 26 }}
          >
            {t('company.aboutTitle')}
          </Text>
          <Text
            className="mt-3 text-sm text-ink-muted dark:text-white/80"
            style={{
              fontFamily: getFontFamily('regular'),
              lineHeight: 22,
              writingDirection: isArabic ? 'rtl' : 'ltr',
            }}
          >
            {description}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
