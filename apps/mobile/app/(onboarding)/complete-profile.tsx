import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RoleSelector } from '@/components/auth/role-selector';
import { CompanyOnboardingWizard } from '@/components/onboarding/company-onboarding-wizard';
import { PhoneVerificationField } from '@/components/profile/phone-verification-field';
import { LoadingView } from '@/components/ui/loading-view';
import { useAuth } from '@/context/auth-context';
import { useProfile } from '@/context/profile-context';
import { useRedirectAfterAuth } from '@/hooks/use-redirect-after-auth';
import { useAppToast } from '@/hooks/use-app-toast';
import { onboardingApi } from '@/lib/api';
import { uploadUserImage } from '@/lib/firebase/storage';
import { extractQatarPhoneDigits, formatQatarPhoneForSubmit } from '@/lib/qatar-phone';
import {
  canAccessDashboard,
  getLockedAccountType,
  isCompanyPendingApproval,
  isCompanyRevisionRequested,
} from '@/lib/profile-routing';
import {
  hasValidationErrors,
  validateReviewerProfileFields,
} from '@/lib/validation/profile-fields';
import type { AccountType, OnboardingStatus } from '@rateq/types';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFontFamily } from '@/i18n';

type OnboardingPhase = 'choose-type' | 'complete-form';

function shouldSkipAccountTypeSelection(
  onboarding: OnboardingStatus | null | undefined,
  companyRevision: boolean,
): boolean {
  if (companyRevision) return true;
  if (onboarding?.reviewerProfile) return true;
  if (onboarding?.company) return true;
  return false;
}

function resolveInitialAccountType(
  onboarding: OnboardingStatus | null | undefined,
  companyRevision: boolean,
): AccountType | null {
  if (onboarding?.accountType) return onboarding.accountType;
  if (companyRevision || onboarding?.company) return 'company';
  if (onboarding?.reviewerProfile) return 'reviewer';
  return null;
}

function OnboardingTopBar({
  onLogout,
  showChangeAccountType,
  onChangeAccountType,
}: {
  onLogout: () => void;
  showChangeAccountType?: boolean;
  onChangeAccountType?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View className="mb-2 flex-row items-center justify-end gap-4">
      {showChangeAccountType ? (
        <Pressable onPress={onChangeAccountType} accessibilityRole="button" className="px-1 py-2">
          <Text
            className="text-sm font-medium text-brand-600 dark:text-brand-400"
            style={{ fontFamily: getFontFamily('medium') }}
          >
            {t('onboarding.changeAccountType')}
          </Text>
        </Pressable>
      ) : null}
      <Pressable onPress={onLogout} accessibilityRole="button" className="px-1 py-2">
        <Text
          className="text-sm font-medium text-brand-600 dark:text-brand-400"
          style={{ fontFamily: getFontFamily('medium') }}
        >
          {t('auth.logout')}
        </Text>
      </Pressable>
    </View>
  );
}

export default function CompleteProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { onboarding, isLoading, refreshOnboarding } = useProfile();
  const redirectAfterAuth = useRedirectAfterAuth();
  const toast = useAppToast();

  const lockedAccountType = getLockedAccountType(onboarding);
  const companyPending = isCompanyPendingApproval(onboarding);
  const companyRevision = isCompanyRevisionRequested(onboarding);

  const [phase, setPhase] = useState<OnboardingPhase>('choose-type');
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const hasInitializedPhase = useRef(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Qatar');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user || isLoading) return;
    if (canAccessDashboard(user, onboarding)) {
      void redirectAfterAuth(user);
    }
  }, [user, onboarding, isLoading, redirectAfterAuth]);

  useEffect(() => {
    if (!onboarding || hasInitializedPhase.current) return;

    const skipTypeSelection = shouldSkipAccountTypeSelection(onboarding, companyRevision);
    const initialAccountType = resolveInitialAccountType(onboarding, companyRevision);

    if (skipTypeSelection) {
      setPhase('complete-form');
      setAccountType(initialAccountType);
    }

    if (onboarding.reviewerProfile) {
      const profile = onboarding.reviewerProfile;
      setFullName(profile.fullName);
      setPhone(extractQatarPhoneDigits(profile.phone));
      setCity(profile.city);
      setCountry(profile.country);
      setBio(profile.bio);
      setAvatarUri(profile.avatarUrl);
    }

    hasInitializedPhase.current = true;
  }, [onboarding, companyRevision]);

  const accountOptions = useMemo(
    () => [
      {
        value: 'reviewer',
        label: t('auth.user'),
        description: t('auth.userDescription'),
        icon: 'person-outline' as const,
      },
      {
        value: 'company',
        label: t('auth.company'),
        description: t('auth.companyDescription'),
        icon: 'business-outline' as const,
      },
    ],
    [t],
  );

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const submitReviewer = async () => {
    const errors = validateReviewerProfileFields(
      {
        fullName,
        phone,
        city,
        country,
        bio,
        hasAvatar: Boolean(avatarUri),
        phoneVerified,
      },
      {
        name: {
          required: t('auth.validationNameRequired'),
          invalid: t('onboarding.nameInvalid'),
          min: t('onboarding.nameMin'),
          max: t('onboarding.nameMax'),
        },
        phone: { required: t('onboarding.fieldRequired'), invalid: t('onboarding.phoneInvalid') },
        location: { required: t('onboarding.fieldRequired') },
        bio: { max: t('onboarding.bioMax') },
        avatar: { required: t('onboarding.avatarRequired') },
        phoneVerification: { required: t('onboarding.phoneNotVerified') },
      },
    );

    setFieldErrors(errors as Record<string, string>);
    if (hasValidationErrors(errors)) {
      toast.error(t('onboarding.fixForm'));
      return;
    }

    setSubmitting(true);
    try {
      let avatarUrl = avatarUri!;
      if (!avatarUri!.startsWith('http')) {
        avatarUrl = await uploadUserImage('avatar', avatarUri!, 'avatar.jpg');
      }

      await onboardingApi.completeReviewer({
        fullName: fullName.trim(),
        phone: formatQatarPhoneForSubmit(phone),
        city: city.trim(),
        country: country.trim(),
        bio: bio.trim() || undefined,
        avatarUrl,
      });

      if (user) {
        await refreshOnboarding();
        await redirectAfterAuth(user);
      }
    } catch (err) {
      toast.apiError(err, t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompanySubmitted = async () => {
    await refreshOnboarding();
    if (user) {
      await redirectAfterAuth(user);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  if (isLoading || !user) {
    return <LoadingView />;
  }

  if (companyPending) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-dm-bg">
        <View className="px-6 pt-2">
          <OnboardingTopBar onLogout={() => void handleLogout()} />
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text
            className="text-center text-2xl font-bold text-ink dark:text-white"
            style={{ fontFamily: getFontFamily('bold') }}
          >
            {t('onboarding.companyPendingTitle')}
          </Text>
          <Text
            className="mt-3 text-center text-sm leading-5 text-ink-muted dark:text-white/80"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {t('onboarding.companyPendingSubtitle')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const showTypeSelection = phase === 'choose-type' && !lockedAccountType && !companyRevision;
  const showReviewerForm =
    phase === 'complete-form' && accountType === 'reviewer' && !lockedAccountType;
  const showCompanyWizard =
    phase === 'complete-form' &&
    accountType === 'company' &&
    (!lockedAccountType || companyRevision);
  const canChangeAccountType = showReviewerForm || showCompanyWizard;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-dm-bg">
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <OnboardingTopBar
          onLogout={() => void handleLogout()}
          showChangeAccountType={canChangeAccountType && !companyRevision}
          onChangeAccountType={() => setPhase('choose-type')}
        />
        <Text
          className="text-2xl font-bold text-ink dark:text-white"
          style={{ fontFamily: getFontFamily('bold') }}
        >
          {showTypeSelection ? t('onboarding.chooseAccountTypeTitle') : t('onboarding.title')}
        </Text>
        <Text
          className="mt-2 text-sm leading-5 text-ink-muted dark:text-white/80"
          style={{ fontFamily: getFontFamily('regular') }}
        >
          {showTypeSelection ? t('onboarding.chooseAccountTypeSubtitle') : t('onboarding.subtitle')}
        </Text>

        {showTypeSelection ? (
          <View className="mt-6">
            <Label>{t('auth.accountType')}</Label>
            <RoleSelector
              value={accountType ?? ''}
              onChange={(value) => setAccountType(value as AccountType)}
              options={accountOptions}
            />
            <Button
              title={t('onboarding.nextStep')}
              variant="gold"
              size="lg"
              className="mt-6 w-full"
              disabled={!accountType}
              onPress={() => setPhase('complete-form')}
            />
          </View>
        ) : null}

        {showCompanyWizard ? (
          <CompanyOnboardingWizard
            existingCompany={onboarding?.company}
            isRevision={companyRevision}
            revisionNotes={onboarding?.company?.revisionNotes}
            onSubmitted={handleCompanySubmitted}
          />
        ) : null}

        {showReviewerForm ? (
          <View className="mt-6 gap-4">
            <View>
              <Label required>{t('auth.name')}</Label>
              <Input
                value={fullName}
                onChangeText={setFullName}
                placeholder={t('auth.namePlaceholder')}
              />
              {fieldErrors.fullName ? (
                <Text className="mt-1 text-sm text-red-500">{fieldErrors.fullName}</Text>
              ) : null}
            </View>

            <PhoneVerificationField
              phone={phone}
              onPhoneChange={setPhone}
              context="reviewer"
              verified={phoneVerified}
              onVerifiedChange={setPhoneVerified}
              error={fieldErrors.phone || fieldErrors.phoneVerification}
              label={t('onboarding.phone')}
            />

            <View>
              <Label required>{t('onboarding.city')}</Label>
              <Input
                value={city}
                onChangeText={setCity}
                placeholder={t('onboarding.cityPlaceholder')}
              />
              {fieldErrors.city ? (
                <Text className="mt-1 text-sm text-red-500">{fieldErrors.city}</Text>
              ) : null}
            </View>
            <View>
              <Label required>{t('onboarding.country')}</Label>
              <Input
                value={country}
                onChangeText={setCountry}
                placeholder={t('onboarding.countryPlaceholder')}
              />
              {fieldErrors.country ? (
                <Text className="mt-1 text-sm text-red-500">{fieldErrors.country}</Text>
              ) : null}
            </View>
            <View>
              <Label>{t('onboarding.bio')}</Label>
              <Input
                value={bio}
                onChangeText={setBio}
                multiline
                className="min-h-[88px] py-3"
                placeholder={t('onboarding.bioPlaceholder')}
              />
              {fieldErrors.bio ? (
                <Text className="mt-1 text-sm text-red-500">{fieldErrors.bio}</Text>
              ) : null}
            </View>
            <View>
              <Label required>{t('onboarding.avatar')}</Label>
              <Pressable
                onPress={() => void pickAvatar()}
                className="mt-1 h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white dark:border-dm-border dark:bg-dm-elevated"
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} className="h-full w-full" />
                ) : (
                  <Text className="text-sm text-ink-muted dark:text-white/70">
                    {t('onboarding.uploadAvatar')}
                  </Text>
                )}
              </Pressable>
              {fieldErrors.avatar ? (
                <Text className="mt-1 text-sm text-red-500">{fieldErrors.avatar}</Text>
              ) : null}
            </View>
            <Button
              title={submitting ? t('onboarding.saving') : t('onboarding.completeProfile')}
              variant="gold"
              size="lg"
              className="mt-2 w-full"
              onPress={() => void submitReviewer()}
              loading={submitting}
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
