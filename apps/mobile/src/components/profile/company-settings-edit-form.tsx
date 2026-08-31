import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QatarPhoneInput } from '@/components/ui/qatar-phone-input';
import { ProfileCatalogChips } from '@/components/profile/profile-catalog-chips';
import { ProfileFormSection } from '@/components/profile/profile-form-section';
import { ProfilePendingBanner } from '@/components/profile/profile-pending-banner';
import { useProfile } from '@/context/profile-context';
import { getFontFamily } from '@/i18n';
import { ApiError, categoriesApi, onboardingApi } from '@/lib/api';
import {
  DOHA_DEFAULT_LOCATION,
  formatMapCoordinates,
  type CompanyMapLocation,
} from '@/lib/company-location';
import { reverseGeocodePlace } from '@/lib/geocoding';
import { profileUpdateSuccessMessage } from '@/lib/profile-update-messages';
import { extractQatarPhoneDigits } from '@/lib/qatar-phone';
import {
  hasValidationErrors,
  sanitizeCompanyName,
  validateCompanySettingsFields,
} from '@/lib/validation/profile-fields';
import type { CategoryPublic, CompanyProfileDetail } from '@rateq/types';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Text, View } from 'react-native';

function buildCompanyLocation(company: CompanyProfileDetail): CompanyMapLocation | null {
  if (company.latitude != null && company.longitude != null) {
    return { latitude: company.latitude, longitude: company.longitude };
  }
  return DOHA_DEFAULT_LOCATION;
}

interface CompanySettingsEditFormProps {
  company: CompanyProfileDetail;
}

export function CompanySettingsEditForm({ company }: CompanySettingsEditFormProps) {
  const { t } = useTranslation();
  const { refreshOnboarding } = useProfile();
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [companyName, setCompanyName] = useState(company.name);
  const [companyAddress, setCompanyAddress] = useState(company.address ?? '');
  const [companyCity, setCompanyCity] = useState(company.city);
  const [companyCountry, setCompanyCountry] = useState(company.country);
  const [companyLocation, setCompanyLocation] = useState<CompanyMapLocation | null>(() =>
    buildCompanyLocation(company),
  );
  const [categoryIds, setCategoryIds] = useState<string[]>(() =>
    company.categoryIds?.length
      ? company.categoryIds
      : company.categoryId
        ? [company.categoryId]
        : [],
  );

  const pendingApproval = company.profileChangeStatus === 'pending';

  useEffect(() => {
    void categoriesApi.list().then(setCategories);
  }, []);

  useEffect(() => {
    if (categories.length === 0) return;
    const liveIds = new Set(categories.map((category) => category.id));
    setCategoryIds((current) => {
      const next = current.filter((id) => liveIds.has(id));
      return next.length === current.length ? current : next;
    });
  }, [categories]);

  const useCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('onboarding.locationPermissionDenied'));
      return;
    }

    setLocating(true);
    try {
      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;
      setCompanyLocation({ latitude, longitude });
      const place = await reverseGeocodePlace(latitude, longitude);
      if (place) {
        setCompanyAddress(place.address);
        if (place.city) setCompanyCity(place.city);
        if (place.country) setCompanyCountry(place.country);
      }
    } catch {
      Alert.alert(t('common.error'), t('onboarding.locationPermissionDenied'));
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async () => {
    const fieldErrors = validateCompanySettingsFields(
      {
        companyName,
        companyAddress,
        companyLocation,
        categoryIds,
        city: companyCity,
        country: companyCountry,
      },
      {
        required: t('onboarding.fieldRequired'),
        companyName: {
          min: t('onboarding.companyNameMin'),
          max: t('onboarding.companyNameMax'),
        },
        locationRequired: t('onboarding.locationRequired'),
      },
    );

    setErrors(fieldErrors);
    if (hasValidationErrors(fieldErrors)) {
      Alert.alert(t('common.error'), t('onboarding.fixForm'));
      return;
    }

    if (!companyLocation) return;

    setSubmitting(true);
    try {
      await onboardingApi.updateCompany({
        name: companyName.trim(),
        address: companyAddress.trim(),
        latitude: companyLocation.latitude,
        longitude: companyLocation.longitude,
        categoryIds,
        country: companyCountry.trim(),
        city: companyCity.trim(),
      });

      await refreshOnboarding();
      Alert.alert(
        t('profile.edit.savedTitle'),
        profileUpdateSuccessMessage(
          company.verificationStatus,
          t('profile.edit.pendingApproval'),
          t('profile.edit.profileUpdated'),
        ),
      );
    } catch (err) {
      Alert.alert(
        t('common.error'),
        err instanceof ApiError ? err.message : t('profile.edit.saveError'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProfileFormSection
      title={t('profile.edit.companyDetailsTitle')}
      subtitle={t('profile.edit.companyDetailsSubtitle')}
      banner={pendingApproval ? <ProfilePendingBanner /> : null}
    >
      <View>
        <Label required>{t('onboarding.companyName')}</Label>
        <Input
          value={companyName}
          onChangeText={(text) => setCompanyName(sanitizeCompanyName(text))}
          onBlur={() => setCompanyName(companyName.trim())}
        />
        {errors.companyName ? (
          <Text className="mt-1 text-sm text-red-500">{errors.companyName}</Text>
        ) : null}
      </View>

      <View className="gap-2">
        <Label required>{t('onboarding.companyLocation')}</Label>
        <Button
          title={locating ? t('onboarding.locatingAddress') : t('onboarding.useCurrentLocation')}
          variant="outline"
          loading={locating}
          onPress={() => void useCurrentLocation()}
        />
        {companyLocation ? (
          <Text
            className="text-sm text-ink-muted dark:text-white/75"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {t('onboarding.locationSelected', {
              coordinates: formatMapCoordinates(companyLocation),
            })}
          </Text>
        ) : null}
        {errors.companyLocation ? (
          <Text className="text-sm text-red-500">{errors.companyLocation}</Text>
        ) : null}
      </View>

      <View>
        <Label required>{t('onboarding.companyAddress')}</Label>
        <Input
          value={companyAddress}
          onChangeText={setCompanyAddress}
          placeholder={t('onboarding.companyAddressPlaceholder')}
        />
        {errors.companyAddress ? (
          <Text className="mt-1 text-sm text-red-500">{errors.companyAddress}</Text>
        ) : null}
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Label required>{t('onboarding.city')}</Label>
          <Input value={companyCity} onChangeText={setCompanyCity} />
        </View>
        <View className="flex-1">
          <Label required>{t('onboarding.country')}</Label>
          <Input value={companyCountry} onChangeText={setCompanyCountry} />
        </View>
      </View>

      <View>
        <Label>{t('onboarding.phone')}</Label>
        <QatarPhoneInput
          value={extractQatarPhoneDigits(company.phone ?? '')}
          onChange={() => undefined}
          editable={false}
          className="opacity-80"
        />
        <Text
          className="mt-1 text-xs text-ink-muted dark:text-white/60"
          style={{ fontFamily: getFontFamily('regular') }}
        >
          {t('profile.edit.phoneReadOnly')}
        </Text>
      </View>

      <View className="gap-2">
        <Label required>{t('onboarding.category')}</Label>
        <Text
          className="text-xs text-ink-muted dark:text-white/70"
          style={{ fontFamily: getFontFamily('regular') }}
        >
          {t('onboarding.categoriesHint')}
        </Text>
        <ProfileCatalogChips
          items={categories.map((category) => ({
            id: category.id,
            nameEn: category.nameEn,
            nameAr: category.nameAr,
          }))}
          selectedIds={categoryIds}
          onChange={setCategoryIds}
        />
        {errors.categoryId ? (
          <Text className="mt-1 text-sm text-red-500">{errors.categoryId}</Text>
        ) : null}
      </View>

      <Button
        title={submitting ? t('onboarding.saving') : t('profile.edit.saveChanges')}
        variant="gold"
        onPress={() => void handleSubmit()}
        loading={submitting}
      />
    </ProfileFormSection>
  );
}
