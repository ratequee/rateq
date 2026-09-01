import { CompanySocialLinksRow } from '@/components/company/company-social-links-row';
import { LoadingView } from '@/components/ui/loading-view';
import { ImageFullscreenViewer } from '@/components/ui/image-fullscreen-viewer';
import { useAppDirection } from '@/hooks/use-app-direction';
import { getCurrentLocale, getFontFamily } from '@/i18n';
import { getLocalizedCompanyName } from '@/lib/company-display';
import { containsArabic } from '@/lib/text-direction';
import { useAppToast } from '@/hooks/use-app-toast';
import { companiesApi } from '@/lib/api';
import type { CompanyProjectPublic, CompanyPublic } from '@rateq/types';
import { Ionicons } from '@expo/vector-icons';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function getProjectServiceLabels(company: CompanyPublic, project: CompanyProjectPublic) {
  if (project.customServices.length > 0) {
    return project.customServices.map((label) => ({ en: label, ar: null as string | null }));
  }

  if (project.serviceIds.length === 0) return [];

  return company.serviceItems
    .filter((item) => project.serviceIds.includes(item.id))
    .map((item) => ({
      en: item.label,
      ar: item.labelAr ?? null,
    }));
}

function ProjectGallery({
  images,
  onImagePress,
}: {
  images: string[];
  onImagePress: (index: number) => void;
}) {
  if (images.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingRight: 4 }}
    >
      {images.map((uri, index) => (
        <Pressable
          key={`${uri}-${index}`}
          onPress={() => onImagePress(index)}
          className="h-28 w-40 overflow-hidden rounded-xl"
        >
          <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />
        </Pressable>
      ))}
    </ScrollView>
  );
}

export default function CompanyProjectDetailScreen() {
  const { slug, projectSlug } = useLocalSearchParams<{ slug: string; projectSlug: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isRtl, textStyle } = useAppDirection();
  const locale = getCurrentLocale();
  const toast = useAppToast();

  const [company, setCompany] = useState<CompanyPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const load = useCallback(async () => {
    if (!slug) return;
    try {
      const c = await companiesApi.getBySlug(slug);
      setCompany(c);
    } catch (err) {
      toast.apiError(err, 'Error');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [slug, toast, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const project = useMemo(
    () => company?.projects.find((item) => item.slug === projectSlug) ?? null,
    [company, projectSlug],
  );

  const galleryImages = useMemo(() => {
    if (!project) return [];
    return [project.imageUrl, ...project.demoImages.filter(Boolean)];
  }, [project]);

  useEffect(() => {
    if (!loading && company && !project) {
      toast.error(t('company.projectNotFound'));
      router.back();
    }
  }, [loading, company, project, t, router, toast]);

  const openGallery = (index: number) => {
    setViewerIndex(index);
    setViewerVisible(true);
  };

  if (loading) return <LoadingView />;
  if (!company || !project) return null;

  const companyName = getLocalizedCompanyName(company, locale);
  const serviceLabels = getProjectServiceLabels(company, project);
  const titleIsArabic = containsArabic(project.title) || locale === 'ar';

  const projectDateLabel = project.projectDate
    ? new Date(project.projectDate).toLocaleDateString(i18n.language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const openProjectUrl = () => {
    const url = project.projectUrl?.trim();
    if (!url) return;
    const href = url.startsWith('http') ? url : `https://${url}`;
    void Linking.openURL(href);
  };

  return (
    <View className="flex-1 bg-white dark:bg-dm-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}>
        <View className="relative overflow-hidden">
          <Pressable onPress={() => openGallery(0)}>
            <Image
              source={{ uri: project.imageUrl }}
              style={{ height: 224, width: '100%' }}
              resizeMode="cover"
            />
            <View
              className="absolute bottom-3 right-3 rounded-full bg-black/45 p-2"
              pointerEvents="none"
            >
              <Ionicons name="expand-outline" size={18} color="#ffffff" />
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            className="absolute left-4 z-20 h-10 w-10 items-center justify-center rounded-full bg-white shadow-md"
            style={{ top: insets.top + 8 }}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name={isRtl ? 'arrow-forward' : 'arrow-back'} size={20} color="#8E2157" />
          </Pressable>
        </View>

        <View className="px-4 pb-6 pt-5">
          <Link href={`/company/${slug}`} asChild>
            <Pressable>
              <Text
                className="text-sm font-medium text-brand-500"
                style={{ fontFamily: getFontFamily('medium'), lineHeight: 20 }}
              >
                {companyName}
              </Text>
            </Pressable>
          </Link>

          <Text
            className="mt-3 text-2xl font-bold text-ink dark:text-white"
            style={[
              {
                fontFamily: getFontFamily('bold'),
                lineHeight: 36,
                paddingVertical: 2,
                writingDirection: titleIsArabic ? 'rtl' : 'ltr',
              },
              textStyle,
            ]}
          >
            {project.title}
          </Text>

          {project.description ? (
            <Text
              className="mt-4 text-sm text-ink-muted dark:text-white/80"
              style={[
                {
                  fontFamily: getFontFamily('regular'),
                  lineHeight: 22,
                  writingDirection: containsArabic(project.description) ? 'rtl' : 'ltr',
                },
                textStyle,
              ]}
            >
              {project.description}
            </Text>
          ) : null}

          <View className="mt-5 flex-row flex-wrap gap-4">
            {project.clientName ? (
              <View className="max-w-full flex-row items-center gap-1.5">
                <Ionicons name="person-outline" size={16} color="#64748b" />
                <Text
                  className="shrink text-sm text-ink-muted dark:text-white/75"
                  style={{ fontFamily: getFontFamily('regular'), lineHeight: 20 }}
                >
                  {t('company.projectClient', { name: project.clientName })}
                </Text>
              </View>
            ) : null}
            {project.location ? (
              <View className="max-w-full flex-row items-center gap-1.5">
                <Ionicons name="location-outline" size={16} color="#64748b" />
                <Text
                  className="shrink text-sm text-ink-muted dark:text-white/75"
                  style={{ fontFamily: getFontFamily('regular'), lineHeight: 20 }}
                >
                  {project.location}
                </Text>
              </View>
            ) : null}
            {projectDateLabel ? (
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="calendar-outline" size={16} color="#64748b" />
                <Text
                  className="text-sm text-ink-muted dark:text-white/75"
                  style={{ fontFamily: getFontFamily('regular'), lineHeight: 20 }}
                >
                  {projectDateLabel}
                </Text>
              </View>
            ) : null}
          </View>

          {serviceLabels.length > 0 ? (
            <View className="mt-6">
              <Text
                className="text-sm font-semibold text-ink dark:text-white"
                style={{ fontFamily: getFontFamily('semibold'), lineHeight: 20 }}
              >
                {t('company.projectServices')}
              </Text>
              <View className="mt-3 flex-row flex-wrap gap-3">
                {serviceLabels.map((label, index) => {
                  const showBoth = Boolean(label.ar?.trim() && label.ar.trim() !== label.en.trim());
                  return (
                    <View
                      key={`${label.en}-${index}`}
                      className="rounded-full border border-slate-200 bg-slate-100 px-4 py-3 dark:border-dm-border dark:bg-dm-elevated"
                    >
                      <Text
                        className="text-sm font-medium text-ink dark:text-white"
                        style={{ fontFamily: getFontFamily('medium'), lineHeight: 20 }}
                      >
                        {label.en}
                      </Text>
                      {showBoth ? (
                        <Text
                          className="mt-1.5 text-ink-muted dark:text-white/70"
                          style={{
                            fontFamily: getFontFamily('regular'),
                            writingDirection: 'rtl',
                            fontSize: 11,
                            lineHeight: 18,
                          }}
                        >
                          {label.ar}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {galleryImages.length > 1 ? (
            <View className="mt-8">
              <Text
                className="mb-3 text-sm font-semibold text-ink dark:text-white"
                style={{ fontFamily: getFontFamily('semibold'), lineHeight: 20 }}
              >
                {t('company.projectGallery')}
              </Text>
              <ProjectGallery images={galleryImages} onImagePress={openGallery} />
            </View>
          ) : null}

          {project.projectUrl?.trim() ? (
            <Pressable onPress={openProjectUrl} className="mt-6 flex-row items-center gap-2">
              <Ionicons name="open-outline" size={18} color="#8E2157" />
              <Text
                className="text-sm font-medium text-brand-500"
                style={{ fontFamily: getFontFamily('medium'), lineHeight: 20 }}
              >
                {t('company.projectExternalLink')}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View className="mx-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-dm-border dark:bg-dm-elevated">
          <Text
            className="text-lg font-semibold text-ink dark:text-white"
            style={{ fontFamily: getFontFamily('semibold'), lineHeight: 26 }}
          >
            {companyName}
          </Text>
          <View className="mt-1 flex-row items-center gap-1.5">
            <Ionicons name="business-outline" size={16} color="#64748b" />
            <Text
              className="text-sm text-ink-muted dark:text-white/75"
              style={{ fontFamily: getFontFamily('regular'), lineHeight: 20 }}
            >
              {company.city}, {company.country}
            </Text>
          </View>
          <CompanySocialLinksRow socialLinks={company.socialLinks} />
          <Link href={`/company/${slug}`} asChild>
            <Pressable className="mt-4">
              <Text
                className="text-sm font-medium text-brand-500"
                style={{ fontFamily: getFontFamily('medium'), lineHeight: 20 }}
              >
                {t('company.viewCompanyProfile')}
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>

      <ImageFullscreenViewer
        images={galleryImages}
        visible={viewerVisible}
        initialIndex={viewerIndex}
        onClose={() => setViewerVisible(false)}
      />
    </View>
  );
}
