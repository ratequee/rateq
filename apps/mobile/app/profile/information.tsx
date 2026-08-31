import { CompanyDocumentsEditForm } from '@/components/profile/company-documents-edit-form';
import { CompanyPublicProfileEditForm } from '@/components/profile/company-public-profile-edit-form';
import { CompanySettingsEditForm } from '@/components/profile/company-settings-edit-form';
import { CompanySocialLinksEditForm } from '@/components/profile/company-social-links-edit-form';
import { ProfileSubscreenLayout } from '@/components/profile/profile-subscreen-layout';
import { ReviewerInformationForm } from '@/components/profile/reviewer-information-form';
import { LoadingView } from '@/components/ui/loading-view';
import { useAuth } from '@/context/auth-context';
import { useProfile } from '@/context/profile-context';
import { getFontFamily } from '@/i18n';
import { UserRole } from '@rateq/types';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

export default function ProfileInformationScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { onboarding, isLoading } = useProfile();

  if (isLoading || !user) return <LoadingView />;

  const reviewer = onboarding?.reviewerProfile;
  const company = onboarding?.company;
  const isCompany = user.role === UserRole.COMPANY;
  const email = isCompany ? (company?.email ?? user.email) : user.email;

  return (
    <ProfileSubscreenLayout title={t('profile.information.title')}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-dm-border dark:bg-dm-surface">
          <Text
            className="text-xs text-ink-muted dark:text-white/60"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {t('profile.edit.accountEmail')}
          </Text>
          <Text
            className="mt-1 text-base font-medium text-ink dark:text-white"
            style={{ fontFamily: getFontFamily('medium') }}
          >
            {email}
          </Text>
        </View>

        {isCompany ? (
          company ? (
            <>
              <CompanyDocumentsEditForm company={company} />
              <CompanySettingsEditForm company={company} />
              <CompanyPublicProfileEditForm company={company} />
              <CompanySocialLinksEditForm company={company} />
            </>
          ) : (
            <Text className="text-sm text-ink-muted dark:text-white/70">
              {t('profile.information.empty')}
            </Text>
          )
        ) : reviewer ? (
          <ReviewerInformationForm profile={reviewer} />
        ) : (
          <Text className="text-sm text-ink-muted dark:text-white/70">
            {t('profile.information.empty')}
          </Text>
        )}
      </ScrollView>
    </ProfileSubscreenLayout>
  );
}
