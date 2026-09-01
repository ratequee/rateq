import { Button } from '@/components/ui/button';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneVerificationField } from '@/components/profile/phone-verification-field';
import { useAppToast } from '@/hooks/use-app-toast';
import { catalogApi, categoriesApi, onboardingApi } from '@/lib/api';
import {
  DOHA_DEFAULT_LOCATION,
  formatMapCoordinates,
  type CompanyMapLocation,
} from '@/lib/company-location';
import { reverseGeocodePlace } from '@/lib/geocoding';
import {
  resolveCompanyDocumentUrls,
  type CompanyExistingAssets,
  type PickedFile,
} from '@/lib/profile-company-assets';
import { formatQatarPhoneForSubmit, extractQatarPhoneDigits } from '@/lib/qatar-phone';
import {
  COMPANY_STEP1_KEYS,
  hasValidationErrors,
  isProfileFileWithinLimit,
  sanitizeCompanyName,
  sanitizeCrNumber,
  validateCompanyProfileFields,
  type CompanyProfileErrors,
} from '@/lib/validation/profile-fields';
import type { CompanyProfileDetail } from '@rateq/types';
import type { CategoryPublic, CompanyCatalogItemPublic } from '@rateq/types';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { getFontFamily } from '@/i18n';
import { useAuth } from '@/context/auth-context';

interface CompanyOnboardingWizardProps {
  existingCompany?: CompanyProfileDetail | null;
  isRevision?: boolean;
  revisionNotes?: string | null;
  onSubmitted: () => Promise<void>;
}

interface BilingualNamedItem {
  id: string;
  nameEn: string;
  nameAr: string;
}

function BilingualChipLabel({
  nameEn,
  nameAr,
  active,
}: {
  nameEn: string;
  nameAr: string;
  active: boolean;
}) {
  const showBoth = nameEn.trim() !== nameAr.trim();

  return (
    <View>
      <Text
        className={`text-sm leading-snug ${active ? 'text-white' : 'text-ink dark:text-white'}`}
        style={{ fontFamily: getFontFamily('medium', nameEn) }}
      >
        {nameEn}
      </Text>
      {showBoth ? (
        <Text
          className={`mt-0.5 text-xs leading-snug ${active ? 'text-white/85' : 'text-ink-muted dark:text-white/70'}`}
          style={{ fontFamily: getFontFamily('regular', nameAr), writingDirection: 'rtl' }}
        >
          {nameAr}
        </Text>
      ) : null}
    </View>
  );
}

function MultiSelectChips({
  items,
  selectedIds,
  onChange,
}: {
  items: BilingualNamedItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id],
    );
  };

  return (
    <View className="min-h-[56px]">
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          flexDirection: 'row',
          alignItems: 'stretch',
          gap: 8,
          paddingVertical: 4,
        }}
      >
        {items.map((item) => {
          const active = selectedIds.includes(item.id);
          return (
            <Pressable
              key={item.id}
              onPress={() => toggle(item.id)}
              className={`shrink-0 rounded-xl border px-3 py-2 ${
                active
                  ? 'border-brand-500 bg-brand-500'
                  : 'border-slate-200 bg-white dark:border-dm-border dark:bg-dm-elevated'
              }`}
            >
              <BilingualChipLabel nameEn={item.nameEn} nameAr={item.nameAr} active={active} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function FilePickerField({
  label,
  required,
  file,
  existingUrl,
  onPick,
  onClear,
  error,
  mode,
}: {
  label: string;
  required?: boolean;
  file: PickedFile | null;
  existingUrl?: string | null;
  onPick: (file: PickedFile) => void;
  onClear: () => void;
  error?: string;
  mode: 'document' | 'image';
}) {
  const { t } = useTranslation();
  const toast = useAppToast();

  const pick = async () => {
    if (mode === 'image') {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const picked: PickedFile = {
        uri: asset.uri,
        name: asset.fileName ?? 'image.jpg',
        mimeType: asset.mimeType ?? 'image/jpeg',
        size: asset.fileSize ?? 0,
      };
      if (!isProfileFileWithinLimit(picked.size)) {
        toast.error(t('onboarding.fileTooLarge'));
        return;
      }
      onPick(picked);
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const picked: PickedFile = {
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? 'application/pdf',
      size: asset.size ?? 0,
    };
    if (!isProfileFileWithinLimit(picked.size)) {
      toast.error(t('onboarding.fileTooLarge'));
      return;
    }
    onPick(picked);
  };

  const hasValue = Boolean(file || existingUrl);

  return (
    <View className="gap-2">
      <Label required={required}>{label}</Label>
      <Pressable
        onPress={() => void pick()}
        className="min-h-[72px] justify-center rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 dark:border-dm-border dark:bg-dm-elevated"
      >
        {file ? (
          <Text
            className="text-sm text-ink dark:text-white"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {file.name}
          </Text>
        ) : existingUrl ? (
          <Text
            className="text-sm text-ink-muted dark:text-white/75"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {t('onboarding.existingFileAttached')}
          </Text>
        ) : (
          <Text
            className="text-sm text-ink-muted dark:text-white/70"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {t('onboarding.tapToUpload')}
          </Text>
        )}
      </Pressable>
      {hasValue ? (
        <Button title={t('onboarding.removeFile')} variant="ghost" onPress={onClear} />
      ) : null}
      {error ? (
        <Text className="text-sm text-red-500" style={{ fontFamily: getFontFamily('regular') }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function CompanyOnboardingWizard({
  existingCompany,
  isRevision,
  revisionNotes,
  onSubmitted,
}: CompanyOnboardingWizardProps) {
  const { t } = useTranslation();
  const { refreshSession } = useAuth();
  const toast = useAppToast();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [errors, setErrors] = useState<CompanyProfileErrors>({});

  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [catalogServices, setCatalogServices] = useState<CompanyCatalogItemPublic[]>([]);
  const [catalogActivities, setCatalogActivities] = useState<CompanyCatalogItemPublic[]>([]);

  const [companyName, setCompanyName] = useState('');
  const [companyNameAr, setCompanyNameAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [activityIds, setActivityIds] = useState<string[]>([]);
  const [firstRegistrationDate, setFirstRegistrationDate] = useState('');
  const [publicProjectCount, setPublicProjectCount] = useState('');
  const [privateProjectCount, setPrivateProjectCount] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyCity, setCompanyCity] = useState('Doha');
  const [companyCountry, setCompanyCountry] = useState('Qatar');
  const [companyLocation, setCompanyLocation] = useState<CompanyMapLocation | null>(
    DOHA_DEFAULT_LOCATION,
  );
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyPhoneVerified, setCompanyPhoneVerified] = useState(false);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [crNumber, setCrNumber] = useState('');
  const [validationDate, setValidationDate] = useState('');
  const [registrationDocFile, setRegistrationDocFile] = useState<PickedFile | null>(null);
  const [establishmentCardFile, setEstablishmentCardFile] = useState<PickedFile | null>(null);
  const [tradeLicenseFile, setTradeLicenseFile] = useState<PickedFile | null>(null);
  const [logoFile, setLogoFile] = useState<PickedFile | null>(null);
  const [coverFile, setCoverFile] = useState<PickedFile | null>(null);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [existingAssets, setExistingAssets] = useState<CompanyExistingAssets>({
    registrationDocUrl: null,
    establishmentCardUrl: null,
    tradeLicenseUrl: null,
    logoUrl: null,
    coverUrl: null,
  });

  useEffect(() => {
    void Promise.all([
      categoriesApi.list(),
      catalogApi.list('service'),
      catalogApi.list('activity'),
    ]).then(([cats, services, activities]) => {
      setCategories(cats);
      setCatalogServices(services);
      setCatalogActivities(activities);
    });
  }, []);

  useEffect(() => {
    if (!existingCompany) return;
    setCompanyName(existingCompany.name ?? '');
    setCompanyNameAr(existingCompany.nameAr ?? '');
    setDescriptionEn(existingCompany.descriptionEn ?? existingCompany.description ?? '');
    setDescriptionAr(existingCompany.descriptionAr ?? '');
    setServiceIds(existingCompany.serviceItems?.map((item) => item.id) ?? []);
    setActivityIds(existingCompany.activityItems?.map((item) => item.id) ?? []);
    setFirstRegistrationDate(existingCompany.firstRegistrationDate?.slice(0, 10) ?? '');
    setPublicProjectCount(
      existingCompany.publicProjectCount != null ? String(existingCompany.publicProjectCount) : '',
    );
    setPrivateProjectCount(
      existingCompany.privateProjectCount != null
        ? String(existingCompany.privateProjectCount)
        : '',
    );
    setCompanyPhone(extractQatarPhoneDigits(existingCompany.phone ?? ''));
    setCategoryIds(
      existingCompany.categoryIds?.length
        ? existingCompany.categoryIds
        : existingCompany.categoryId
          ? [existingCompany.categoryId]
          : [],
    );
    setCompanyAddress(existingCompany.address ?? '');
    if (existingCompany.latitude != null && existingCompany.longitude != null) {
      setCompanyLocation({
        latitude: existingCompany.latitude,
        longitude: existingCompany.longitude,
      });
    }
    setCrNumber(existingCompany.crNumber ?? '');
    setValidationDate(existingCompany.validationDate?.slice(0, 10) ?? '');
    setCompanyCountry(existingCompany.country ?? 'Qatar');
    setCompanyCity(existingCompany.city ?? 'Doha');
    setExistingAssets({
      registrationDocUrl: existingCompany.registrationDocUrl,
      establishmentCardUrl: existingCompany.establishmentCardUrl,
      tradeLicenseUrl: existingCompany.tradeLicenseUrl,
      logoUrl: existingCompany.logo,
      coverUrl: existingCompany.coverUrl,
    });
  }, [existingCompany]);

  const validationMessages = useMemo(
    () => ({
      required: t('onboarding.fieldRequired'),
      fileTooLarge: t('onboarding.fileTooLarge'),
      companyName: {
        required: t('onboarding.fieldRequired'),
        invalid: t('onboarding.companyNameInvalid'),
        min: t('onboarding.companyNameMin'),
        max: t('onboarding.companyNameMax'),
      },
      crNumber: { invalid: t('onboarding.crNumberInvalid') },
      phone: { required: t('onboarding.fieldRequired'), invalid: t('onboarding.phoneInvalid') },
      phoneVerification: { required: t('onboarding.phoneNotVerified') },
      locationRequired: t('onboarding.locationRequired'),
      legalRequired: t('onboarding.legalRequired'),
    }),
    [t],
  );

  const buildValidationFields = () => ({
    companyName,
    companyAddress,
    companyLocation,
    companyPhone,
    categoryIds,
    crNumber,
    validationDate,
    city: companyCity,
    country: companyCountry,
    hasRegistrationDoc: Boolean(registrationDocFile || existingAssets.registrationDocUrl),
    hasEstablishmentCard: Boolean(establishmentCardFile || existingAssets.establishmentCardUrl),
    hasTradeLicense: Boolean(tradeLicenseFile || existingAssets.tradeLicenseUrl),
    hasLogo: Boolean(logoFile || existingAssets.logoUrl),
    hasCover: Boolean(coverFile || existingAssets.coverUrl),
    companyPhoneVerified,
    acceptedLegal,
  });

  const validateStep1 = () => {
    const fieldErrors = validateCompanyProfileFields(buildValidationFields(), validationMessages);
    const stepErrors = Object.fromEntries(
      Object.entries(fieldErrors).filter(([key]) => COMPANY_STEP1_KEYS.has(key)),
    ) as CompanyProfileErrors;
    setErrors(stepErrors);
    return !hasValidationErrors(stepErrors);
  };

  const validateAll = () => {
    const fieldErrors = validateCompanyProfileFields(buildValidationFields(), validationMessages);
    setErrors(fieldErrors);
    return !hasValidationErrors(fieldErrors);
  };

  const useCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      toast.error(t('onboarding.locationPermissionDenied'));
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
        return;
      }

      toast.error(t('onboarding.locationLookupFailed'));
    } catch {
      toast.error(t('onboarding.locationPermissionDenied'));
    } finally {
      setLocating(false);
    }
  };

  const submit = async () => {
    if (!validateAll()) {
      toast.error(t('onboarding.fixForm'));
      return;
    }
    if (!companyLocation) return;

    setSubmitting(true);
    try {
      const assets = await resolveCompanyDocumentUrls({
        registrationDocFile,
        establishmentCardFile,
        tradeLicenseFile,
        logoFile,
        coverFile,
        existing: existingAssets,
      });

      if (
        !assets.registrationDocUrl ||
        !assets.establishmentCardUrl ||
        !assets.tradeLicenseUrl ||
        !assets.logoUrl ||
        !assets.coverUrl
      ) {
        throw new Error(t('onboarding.fieldRequired'));
      }

      const payload = {
        name: companyName.trim(),
        nameAr: companyNameAr.trim() || undefined,
        descriptionEn: descriptionEn.trim() || undefined,
        descriptionAr: descriptionAr.trim() || undefined,
        serviceIds,
        activityIds,
        firstRegistrationDate: firstRegistrationDate || undefined,
        publicProjectCount: publicProjectCount ? Number(publicProjectCount) : undefined,
        privateProjectCount: privateProjectCount ? Number(privateProjectCount) : undefined,
        address: companyAddress.trim(),
        latitude: companyLocation.latitude,
        longitude: companyLocation.longitude,
        phone: formatQatarPhoneForSubmit(companyPhone),
        categoryIds,
        crNumber: crNumber.trim(),
        validationDate,
        registrationDocUrl: assets.registrationDocUrl,
        establishmentCardUrl: assets.establishmentCardUrl,
        tradeLicenseUrl: assets.tradeLicenseUrl,
        logo: assets.logoUrl,
        coverUrl: assets.coverUrl,
        country: companyCountry.trim(),
        city: companyCity.trim(),
      };

      if (isRevision && existingCompany) {
        await onboardingApi.updateCompany(payload);
      } else {
        await onboardingApi.registerCompany(payload);
        await refreshSession();
      }

      await onSubmitted();
      toast.success(
        isRevision
          ? t('onboarding.companyResubmittedMessage')
          : t('onboarding.companySubmittedMessage'),
        t('onboarding.companySubmittedTitle'),
      );
    } catch (err) {
      toast.apiError(err, t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabel =
    step === 1
      ? t('onboarding.companyStepEnglish')
      : step === 2
        ? t('onboarding.companyStepArabic')
        : t('onboarding.companyStepDocuments');

  return (
    <View className="mt-6">
      {isRevision && revisionNotes ? (
        <View className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <Text
            className="font-semibold text-amber-900 dark:text-amber-100"
            style={{ fontFamily: getFontFamily('semibold') }}
          >
            {t('onboarding.companyRevisionTitle')}
          </Text>
          <Text
            className="mt-2 text-sm text-amber-950 dark:text-amber-100"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {revisionNotes}
          </Text>
        </View>
      ) : null}

      <View className="mb-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-dm-border dark:bg-dm-surface">
        <Text
          className="text-xs uppercase text-ink-muted dark:text-white/70"
          style={{ fontFamily: getFontFamily('medium') }}
        >
          {t('onboarding.companyStepIndicator', { current: step, total: 3 })}
        </Text>
        <Text
          className="mt-1 text-base font-semibold text-ink dark:text-white"
          style={{ fontFamily: getFontFamily('semibold') }}
        >
          {stepLabel}
        </Text>
        <View className="mt-3 flex-row gap-2">
          {[1, 2, 3].map((index) => (
            <View
              key={index}
              className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-brand-500' : 'bg-slate-200 dark:bg-dm-hover'}`}
            />
          ))}
        </View>
      </View>

      {step === 1 ? (
        <View className="gap-4">
          <View>
            <Label required>{t('onboarding.companyNameEn')}</Label>
            <Input
              value={companyName}
              onChangeText={(text) => setCompanyName(sanitizeCompanyName(text))}
              onBlur={() => setCompanyName(companyName.trim())}
              placeholder={t('onboarding.companyNameEnPlaceholder')}
            />
            {errors.companyName ? (
              <Text className="mt-1 text-sm text-red-500">{errors.companyName}</Text>
            ) : null}
          </View>

          <View className="gap-2">
            <Label>{t('onboarding.companyAboutEn')}</Label>
            <Input
              value={descriptionEn}
              onChangeText={setDescriptionEn}
              multiline
              placeholder={t('onboarding.companyAboutPlaceholder')}
            />
          </View>

          <View className="gap-2">
            <Label>{t('onboarding.companyServices')}</Label>
            <Text
              className="text-xs text-ink-muted dark:text-white/70"
              style={{ fontFamily: getFontFamily('regular') }}
            >
              {t('onboarding.companyServicesHint')}
            </Text>
            <MultiSelectChips
              items={catalogServices}
              selectedIds={serviceIds}
              onChange={setServiceIds}
            />
          </View>

          <View className="gap-2">
            <Label>{t('onboarding.companyActivities')}</Label>
            <Text
              className="text-xs text-ink-muted dark:text-white/70"
              style={{ fontFamily: getFontFamily('regular') }}
            >
              {t('onboarding.companyActivitiesHint')}
            </Text>
            <MultiSelectChips
              items={catalogActivities}
              selectedIds={activityIds}
              onChange={setActivityIds}
            />
          </View>

          <DatePickerField
            label={t('onboarding.firstRegistrationDate')}
            value={firstRegistrationDate}
            onChange={setFirstRegistrationDate}
            maximumDate={new Date()}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Label>{t('onboarding.publicProjectCount')}</Label>
              <Input
                value={publicProjectCount}
                onChangeText={setPublicProjectCount}
                keyboardType="number-pad"
              />
            </View>
            <View className="flex-1">
              <Label>{t('onboarding.privateProjectCount')}</Label>
              <Input
                value={privateProjectCount}
                onChangeText={setPrivateProjectCount}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View className="gap-2">
            <Label required>{t('onboarding.companyLocation')}</Label>
            <Button
              title={
                locating ? t('onboarding.locatingAddress') : t('onboarding.useCurrentLocation')
              }
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

          <PhoneVerificationField
            phone={companyPhone}
            onPhoneChange={setCompanyPhone}
            context="company"
            verified={companyPhoneVerified}
            onVerifiedChange={setCompanyPhoneVerified}
            error={errors.companyPhone || errors.companyPhoneVerification}
            label={t('onboarding.phone')}
          />

          <View className="gap-2">
            <Label required>{t('onboarding.category')}</Label>
            <Text
              className="text-xs text-ink-muted dark:text-white/70"
              style={{ fontFamily: getFontFamily('regular') }}
            >
              {t('onboarding.categoriesHint')}
            </Text>
            <MultiSelectChips
              items={categories}
              selectedIds={categoryIds}
              onChange={setCategoryIds}
            />
            {errors.categoryId ? (
              <Text className="mt-1 text-sm text-red-500">{errors.categoryId}</Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {step === 2 ? (
        <View className="gap-4">
          <View>
            <Label>{t('onboarding.companyNameAr')}</Label>
            <Input
              value={companyNameAr}
              onChangeText={setCompanyNameAr}
              placeholder={t('onboarding.companyNameArPlaceholder')}
            />
          </View>
          <View className="gap-2">
            <Label>{t('onboarding.companyAboutAr')}</Label>
            <Input
              value={descriptionAr}
              onChangeText={setDescriptionAr}
              multiline
              className="min-h-[120px]"
              style={{ minHeight: 120 }}
              placeholder={t('onboarding.companyAboutArPlaceholder')}
            />
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View className="gap-4">
          <View>
            <Label required>{t('onboarding.crNumber')}</Label>
            <Input value={crNumber} onChangeText={(text) => setCrNumber(sanitizeCrNumber(text))} />
            {errors.crNumber ? (
              <Text className="mt-1 text-sm text-red-500">{errors.crNumber}</Text>
            ) : null}
          </View>
          <DatePickerField
            label={t('onboarding.validationDate')}
            required
            value={validationDate}
            onChange={setValidationDate}
            error={errors.validationDate}
          />

          <FilePickerField
            label={t('onboarding.registrationFile')}
            required
            file={registrationDocFile}
            existingUrl={existingAssets.registrationDocUrl}
            onPick={setRegistrationDocFile}
            onClear={() => {
              setRegistrationDocFile(null);
              setExistingAssets((prev) => ({ ...prev, registrationDocUrl: null }));
            }}
            error={errors.registrationDocFile}
            mode="document"
          />
          <FilePickerField
            label={t('onboarding.establishmentCardFile')}
            required
            file={establishmentCardFile}
            existingUrl={existingAssets.establishmentCardUrl}
            onPick={setEstablishmentCardFile}
            onClear={() => {
              setEstablishmentCardFile(null);
              setExistingAssets((prev) => ({ ...prev, establishmentCardUrl: null }));
            }}
            error={errors.establishmentCardFile}
            mode="document"
          />
          <FilePickerField
            label={t('onboarding.tradeLicenseFile')}
            required
            file={tradeLicenseFile}
            existingUrl={existingAssets.tradeLicenseUrl}
            onPick={setTradeLicenseFile}
            onClear={() => {
              setTradeLicenseFile(null);
              setExistingAssets((prev) => ({ ...prev, tradeLicenseUrl: null }));
            }}
            error={errors.tradeLicenseFile}
            mode="document"
          />
          <FilePickerField
            label={t('onboarding.logoFile')}
            required
            file={logoFile}
            existingUrl={existingAssets.logoUrl}
            onPick={setLogoFile}
            onClear={() => {
              setLogoFile(null);
              setExistingAssets((prev) => ({ ...prev, logoUrl: null }));
            }}
            error={errors.logoFile}
            mode="image"
          />
          {logoFile || existingAssets.logoUrl ? (
            <Image
              source={{ uri: logoFile?.uri ?? existingAssets.logoUrl ?? undefined }}
              className="h-24 w-24 rounded-xl"
            />
          ) : null}
          <FilePickerField
            label={t('onboarding.coverFile')}
            required
            file={coverFile}
            existingUrl={existingAssets.coverUrl}
            onPick={setCoverFile}
            onClear={() => {
              setCoverFile(null);
              setExistingAssets((prev) => ({ ...prev, coverUrl: null }));
            }}
            error={errors.coverFile}
            mode="image"
          />
          {coverFile || existingAssets.coverUrl ? (
            <Image
              source={{ uri: coverFile?.uri ?? existingAssets.coverUrl ?? undefined }}
              className="h-28 w-full rounded-xl"
              resizeMode="cover"
            />
          ) : null}

          <Pressable
            onPress={() => setAcceptedLegal((value) => !value)}
            className="flex-row items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-dm-border dark:bg-dm-surface"
          >
            <View
              className={`mt-0.5 h-5 w-5 items-center justify-center rounded border ${
                acceptedLegal
                  ? 'border-brand-500 bg-brand-500'
                  : 'border-slate-300 dark:border-dm-border'
              }`}
            >
              {acceptedLegal ? <Text className="text-xs text-white">✓</Text> : null}
            </View>
            <Text
              className="flex-1 text-sm text-ink dark:text-white"
              style={{ fontFamily: getFontFamily('regular') }}
            >
              {t('onboarding.legalConsent')}
            </Text>
          </Pressable>
          {errors.acceptedLegal ? (
            <Text className="text-sm text-red-500">{errors.acceptedLegal}</Text>
          ) : null}
        </View>
      ) : null}

      <View className="mt-6 flex-row gap-3">
        {step > 1 ? (
          <Button
            title={t('onboarding.previousStep')}
            variant="outline"
            className="flex-1"
            onPress={() => setStep((current) => current - 1)}
          />
        ) : (
          <View className="flex-1" />
        )}
        {step < 3 ? (
          <Button
            title={t('onboarding.nextStep')}
            variant="gold"
            className="flex-1"
            onPress={() => {
              if (step === 1 && !validateStep1()) {
                toast.error(t('onboarding.fixForm'));
                return;
              }
              setStep((current) => current + 1);
            }}
          />
        ) : (
          <Button
            title={submitting ? t('onboarding.saving') : t('onboarding.submitCompany')}
            variant="gold"
            className="flex-1"
            loading={submitting}
            onPress={() => void submit()}
          />
        )}
      </View>
    </View>
  );
}
