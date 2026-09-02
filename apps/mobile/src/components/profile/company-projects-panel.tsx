import { Button } from '@/components/ui/button';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { Input } from '@/components/ui/input';
import { ImageFullscreenViewer } from '@/components/ui/image-fullscreen-viewer';
import { Label } from '@/components/ui/label';
import { ProfileFormSection } from '@/components/profile/profile-form-section';
import { useProfile } from '@/context/profile-context';
import { useAppToast } from '@/hooks/use-app-toast';
import { getFontFamily } from '@/i18n';
import { onboardingApi } from '@/lib/api';
import { ensureFirebaseUserForUpload } from '@/lib/firebase/ensure-user';
import {
  MAX_COMPANY_PROJECTS,
  MAX_PROJECT_CUSTOM_SERVICES,
  MAX_PROJECT_DEMO_IMAGES,
  uploadProjectCoverImage,
  uploadProjectDemoImage,
} from '@/lib/company-project-upload';
import { cn } from '@/lib/cn';
import { isProfileFileWithinLimit } from '@/lib/validation/profile-fields';
import type { PickedFile } from '@/lib/profile-company-assets';
import {
  CompanyProjectStatus,
  type CompanyProfileDetail,
  type UpdateCompanyProjectInput,
} from '@rateq/types';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

interface ProjectDraft {
  slug?: string;
  title: string;
  description: string;
  imageUrl: string;
  projectUrl: string;
  demoImages: string[];
  demoImageFiles: PickedFile[];
  clientName: string;
  location: string;
  projectDate: string;
  customServices: string[];
  imageFile: PickedFile | null;
  status?: CompanyProjectStatus;
}

const statusStyles: Record<CompanyProjectStatus, string> = {
  [CompanyProjectStatus.PENDING]:
    'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  [CompanyProjectStatus.APPROVED]:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  [CompanyProjectStatus.REJECTED]: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400',
};

function createEmptyProject(): ProjectDraft {
  return {
    title: '',
    description: '',
    imageUrl: '',
    projectUrl: '',
    demoImages: [],
    demoImageFiles: [],
    clientName: '',
    location: '',
    projectDate: '',
    customServices: [],
    imageFile: null,
  };
}

function buildProjectDrafts(company: CompanyProfileDetail): ProjectDraft[] {
  if (!company.projects?.length) return [];
  return company.projects.map((project) => ({
    slug: project.slug,
    title: project.title,
    description: project.description ?? '',
    imageUrl: project.imageUrl,
    projectUrl: project.projectUrl ?? '',
    demoImages: project.demoImages ?? [],
    demoImageFiles: [],
    clientName: project.clientName ?? '',
    location: project.location ?? '',
    projectDate: project.projectDate?.slice(0, 10) ?? '',
    customServices: project.customServices ?? [],
    imageFile: null,
    status: project.status,
  }));
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

async function pickProjectImage(): Promise<PickedFile | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.9,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.fileName ?? 'project.jpg',
    mimeType: asset.mimeType ?? 'image/jpeg',
    size: asset.fileSize ?? 0,
  };
}

async function buildProjectPayloadOrThrow(
  projects: ProjectDraft[],
  t: (key: string) => string,
): Promise<UpdateCompanyProjectInput[]> {
  await ensureFirebaseUserForUpload();

  const projectPayload: UpdateCompanyProjectInput[] = [];

  for (const project of projects) {
    const title = project.title.trim();
    if (!title) continue;

    if (project.customServices.length > MAX_PROJECT_CUSTOM_SERVICES) {
      throw new Error(t('companyProjects.projectServicesMax'));
    }

    const projectUrl = project.projectUrl.trim();
    if (projectUrl && !isValidUrl(projectUrl)) {
      throw new Error(t('companyProjects.projectUrlInvalid'));
    }

    let imageUrl = project.imageUrl.trim();
    if (project.imageFile) {
      imageUrl = await uploadProjectCoverImage(project.imageFile);
    }

    if (!imageUrl) {
      throw new Error(t('companyProjects.projectImageRequired'));
    }

    const demoImages = [...project.demoImages];
    for (const file of project.demoImageFiles) {
      if (demoImages.length >= MAX_PROJECT_DEMO_IMAGES) break;
      demoImages.push(await uploadProjectDemoImage(file));
    }

    projectPayload.push({
      slug: project.slug,
      title,
      description: project.description.trim() || undefined,
      imageUrl,
      projectUrl: projectUrl || undefined,
      demoImages: demoImages.slice(0, MAX_PROJECT_DEMO_IMAGES),
      clientName: project.clientName.trim() || undefined,
      location: project.location.trim() || undefined,
      projectDate: project.projectDate || undefined,
      customServices: project.customServices,
    });
  }

  const hasTitledProject = projects.some((project) => project.title.trim());
  if (hasTitledProject && projectPayload.length === 0) {
    throw new Error(t('companyProjects.projectImageRequired'));
  }

  return projectPayload;
}

function CustomServicesInput({
  services,
  onChange,
}: {
  services: string[];
  onChange: (services: string[]) => void;
}) {
  const { t } = useTranslation();
  const toast = useAppToast();
  const [draft, setDraft] = useState('');

  const addService = () => {
    const value = draft.trim();
    if (!value) return;
    if (services.length >= MAX_PROJECT_CUSTOM_SERVICES) {
      toast.error(t('companyProjects.projectServicesMax'));
      return;
    }
    if (services.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...services, value]);
    setDraft('');
  };

  return (
    <View className="gap-2">
      <Label>{t('companyProjects.projectServices')}</Label>
      <Text
        className="text-xs text-ink-muted dark:text-white/60"
        style={{ fontFamily: getFontFamily('regular') }}
      >
        {t('companyProjects.projectServicesHint')}
      </Text>
      {services.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {services.map((service, index) => (
            <View
              key={`${service}-${index}`}
              className="flex-row items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 dark:border-dm-border dark:bg-dm-elevated"
            >
              <Text
                className="text-sm text-ink dark:text-white"
                style={{ fontFamily: getFontFamily('regular') }}
              >
                {service}
              </Text>
              <Pressable
                onPress={() => onChange(services.filter((_, i) => i !== index))}
                accessibilityRole="button"
                accessibilityLabel={t('companyProjects.removeService')}
                hitSlop={8}
              >
                <Ionicons name="close" size={14} color="#64748b" />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      <View className="flex-row gap-2">
        <Input
          value={draft}
          onChangeText={setDraft}
          placeholder={t('companyProjects.servicePlaceholder')}
          maxLength={100}
          className="flex-1"
          editable={services.length < MAX_PROJECT_CUSTOM_SERVICES}
          onSubmitEditing={addService}
        />
        <Button
          title={t('companyProjects.addService')}
          variant="outline"
          onPress={addService}
          disabled={services.length >= MAX_PROJECT_CUSTOM_SERVICES}
          className="px-4"
        />
      </View>
    </View>
  );
}

function ProjectFormModal({
  visible,
  title,
  draft,
  saving,
  isVerified,
  onChange,
  onClose,
  onSave,
}: {
  visible: boolean;
  title: string;
  draft: ProjectDraft;
  saving: boolean;
  isVerified: boolean;
  onChange: (patch: Partial<ProjectDraft>) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ProjectFormModalContent
          title={title}
          draft={draft}
          saving={saving}
          isVerified={isVerified}
          onChange={onChange}
          onClose={onClose}
          onSave={onSave}
        />
      </SafeAreaProvider>
    </Modal>
  );
}

function ProjectFormModalContent({
  title,
  draft,
  saving,
  isVerified,
  onChange,
  onClose,
  onSave,
}: {
  title: string;
  draft: ProjectDraft;
  saving: boolean;
  isVerified: boolean;
  onChange: (patch: Partial<ProjectDraft>) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const { t } = useTranslation();
  const toast = useAppToast();
  const insets = useSafeAreaInsets();
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const coverPreview = draft.imageFile?.uri ?? draft.imageUrl ?? null;
  const demoPreviewUrls = useMemo(
    () => [...draft.demoImages, ...draft.demoImageFiles.map((file) => file.uri)],
    [draft.demoImages, draft.demoImageFiles],
  );

  const pickCover = async () => {
    const file = await pickProjectImage();
    if (!file) return;
    if (!isProfileFileWithinLimit(file.size)) {
      toast.error(t('onboarding.fileTooLarge'));
      return;
    }
    onChange({ imageFile: file, imageUrl: '' });
  };

  const pickDemoImages = async () => {
    const remaining =
      MAX_PROJECT_DEMO_IMAGES - draft.demoImages.length - draft.demoImageFiles.length;
    if (remaining <= 0) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });
    if (result.canceled || !result.assets.length) return;

    const nextFiles: PickedFile[] = [];
    for (const asset of result.assets.slice(0, remaining)) {
      const file: PickedFile = {
        uri: asset.uri,
        name: asset.fileName ?? `demo-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
        size: asset.fileSize ?? 0,
      };
      if (!isProfileFileWithinLimit(file.size)) {
        toast.error(t('onboarding.fileTooLarge'));
        continue;
      }
      nextFiles.push(file);
    }

    if (nextFiles.length > 0) {
      onChange({ demoImageFiles: [...draft.demoImageFiles, ...nextFiles] });
    }
  };

  return (
    <>
      <View
        className="flex-1 bg-white dark:bg-dm-bg"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-dm-border">
            <Pressable onPress={onClose} disabled={saving} hitSlop={8}>
              <Text
                className="text-base text-brand-600 dark:text-brand-400"
                style={{ fontFamily: getFontFamily('medium') }}
              >
                {t('common.cancel')}
              </Text>
            </Pressable>
            <Text
              className="max-w-[60%] text-center text-base font-semibold text-ink dark:text-white"
              style={{ fontFamily: getFontFamily('semibold') }}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Pressable onPress={onSave} disabled={saving} hitSlop={8}>
              <Text
                className="text-base text-brand-600 dark:text-brand-400"
                style={{ fontFamily: getFontFamily('semibold') }}
              >
                {saving ? t('companyProjects.saving') : t('companyProjects.saveProject')}
              </Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
          >
            {isVerified ? (
              <Text
                className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
                style={{ fontFamily: getFontFamily('regular') }}
              >
                {t('companyProjects.projectModalModerationHint')}
              </Text>
            ) : null}

            <View className="gap-4">
              <View>
                <Label required>{t('companyProjects.projectTitle')}</Label>
                <Input
                  value={draft.title}
                  onChangeText={(titleValue) => onChange({ title: titleValue })}
                  maxLength={200}
                  className="mt-1"
                />
              </View>

              <View>
                <Label>{t('companyProjects.projectDescription')}</Label>
                <Input
                  value={draft.description}
                  onChangeText={(description) => onChange({ description })}
                  multiline
                  numberOfLines={4}
                  maxLength={2000}
                  className="mt-1 min-h-[100px] py-3"
                />
              </View>

              <View>
                <Label required>{t('companyProjects.projectCoverImage')}</Label>
                {coverPreview ? (
                  <Pressable onPress={() => setPreviewImage(coverPreview)} className="mt-2">
                    <View className="relative h-40 overflow-hidden rounded-2xl">
                      <Image
                        source={{ uri: coverPreview }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                      <Pressable
                        onPress={() => onChange({ imageUrl: '', imageFile: null })}
                        className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-black/60"
                        hitSlop={8}
                      >
                        <Ionicons name="close" size={18} color="#ffffff" />
                      </Pressable>
                    </View>
                  </Pressable>
                ) : null}
                <Button
                  title={
                    coverPreview
                      ? t('companyProjects.changeCoverImage')
                      : t('companyProjects.uploadCoverImage')
                  }
                  variant="outline"
                  onPress={() => void pickCover()}
                  className="mt-2"
                />
              </View>

              <View>
                <Label>{t('companyProjects.projectDemoImages')}</Label>
                <Text
                  className="mt-1 text-xs text-ink-muted dark:text-white/60"
                  style={{ fontFamily: getFontFamily('regular') }}
                >
                  {t('companyProjects.projectDemoImagesHint')}
                </Text>
                {demoPreviewUrls.length > 0 ? (
                  <View className="mt-2 flex-row flex-wrap gap-2">
                    {demoPreviewUrls.map((url, imageIndex) => {
                      const existingCount = draft.demoImages.length;
                      const isExisting = imageIndex < existingCount;
                      return (
                        <View
                          key={`${url}-${imageIndex}`}
                          className="relative h-20 w-20 overflow-hidden rounded-xl"
                        >
                          <Pressable onPress={() => setPreviewImage(url)} className="h-full w-full">
                            <Image
                              source={{ uri: url }}
                              className="h-full w-full"
                              resizeMode="cover"
                            />
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              if (isExisting) {
                                onChange({
                                  demoImages: draft.demoImages.filter((_, i) => i !== imageIndex),
                                });
                                return;
                              }
                              const fileIndex = imageIndex - existingCount;
                              onChange({
                                demoImageFiles: draft.demoImageFiles.filter(
                                  (_, i) => i !== fileIndex,
                                ),
                              });
                            }}
                            className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-black/60"
                            hitSlop={8}
                          >
                            <Ionicons name="close" size={14} color="#ffffff" />
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
                <Button
                  title={t('companyProjects.addDemoImages')}
                  variant="outline"
                  onPress={() => void pickDemoImages()}
                  disabled={demoPreviewUrls.length >= MAX_PROJECT_DEMO_IMAGES}
                  className="mt-2"
                />
              </View>

              <View>
                <Label>{t('companyProjects.projectClientName')}</Label>
                <Input
                  value={draft.clientName}
                  onChangeText={(clientName) => onChange({ clientName })}
                  maxLength={200}
                  className="mt-1"
                />
              </View>

              <View>
                <Label>{t('companyProjects.projectLocation')}</Label>
                <Input
                  value={draft.location}
                  onChangeText={(location) => onChange({ location })}
                  maxLength={200}
                  className="mt-1"
                />
              </View>

              <DatePickerField
                label={t('companyProjects.projectDate')}
                value={draft.projectDate}
                onChange={(projectDate) => onChange({ projectDate })}
                maximumDate={new Date()}
              />

              <View>
                <Label>{t('companyProjects.projectUrl')}</Label>
                <Input
                  value={draft.projectUrl}
                  onChangeText={(projectUrl) => onChange({ projectUrl })}
                  placeholder="https://example.com/project"
                  maxLength={2048}
                  autoCapitalize="none"
                  keyboardType="url"
                  className="mt-1"
                />
              </View>

              <CustomServicesInput
                services={draft.customServices}
                onChange={(customServices) => onChange({ customServices })}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <ImageFullscreenViewer
        images={previewImage ? [previewImage] : []}
        visible={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
      />
    </>
  );
}

interface CompanyProjectsPanelProps {
  refreshToken?: number;
  onRefreshEnd?: () => void;
}

export function CompanyProjectsPanel({
  refreshToken = 0,
  onRefreshEnd,
}: CompanyProjectsPanelProps) {
  const { t } = useTranslation();
  const toast = useAppToast();
  const { onboarding, refreshOnboarding } = useProfile();
  const company = onboarding?.company ?? null;

  const [projects, setProjects] = useState<ProjectDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [modalDraft, setModalDraft] = useState<ProjectDraft>(createEmptyProject());
  const onRefreshEndRef = useRef(onRefreshEnd);
  onRefreshEndRef.current = onRefreshEnd;

  const isVerified = company?.verificationStatus === 'approved';
  const hasPendingProjects = projects.some(
    (project) => project.status === CompanyProjectStatus.PENDING,
  );

  useEffect(() => {
    void refreshOnboarding().finally(() => {
      onRefreshEndRef.current?.();
    });
  }, [refreshToken, refreshOnboarding]);

  useEffect(() => {
    if (company) {
      setProjects(buildProjectDrafts(company));
    }
  }, [company]);

  const persistProjects = async (
    nextProjects: ProjectDraft[],
    options: { showToast?: boolean; successType?: 'saved' | 'deleted' } = {},
  ) => {
    const { showToast = true, successType = 'saved' } = options;
    if (!company) {
      throw new Error(t('companyProjects.noCompany'));
    }

    setSaving(true);
    try {
      const projectPayload = await buildProjectPayloadOrThrow(nextProjects, t);
      const updatedCompany = await onboardingApi.updateCompany({ projects: projectPayload });
      setProjects(
        buildProjectDrafts({
          ...company,
          projects: updatedCompany.projects ?? [],
        }),
      );
      void refreshOnboarding();

      if (showToast) {
        const message =
          successType === 'deleted'
            ? t('companyProjects.projectDeleted')
            : isVerified
              ? t('companyProjects.projectsSubmittedForApproval')
              : t('companyProjects.projectsUpdated');
        toast.success(message);
      }
    } catch (err) {
      toast.apiError(err, t('companyProjects.saveError'));
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const resetModal = () => {
    setModalOpen(false);
    setEditingIndex(null);
    setModalDraft(createEmptyProject());
  };

  const openAddModal = () => {
    if (projects.length >= MAX_COMPANY_PROJECTS) {
      toast.error(t('companyProjects.projectLimitReached'));
      return;
    }
    setEditingIndex(null);
    setModalDraft(createEmptyProject());
    setModalOpen(true);
  };

  const openEditModal = (index: number) => {
    const project = projects[index];
    if (!project) return;
    setEditingIndex(index);
    setModalDraft({ ...project, demoImageFiles: [], imageFile: null });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    resetModal();
  };

  const handleModalSave = async () => {
    const title = modalDraft.title.trim();
    if (!title) {
      toast.error(t('companyProjects.projectTitleRequired'));
      return;
    }

    const hasImage = Boolean(modalDraft.imageUrl.trim() || modalDraft.imageFile);
    if (!hasImage) {
      toast.error(t('companyProjects.projectImageRequired'));
      return;
    }

    const nextProjects =
      editingIndex === null
        ? [...projects, modalDraft]
        : projects.map((project, index) => (index === editingIndex ? modalDraft : project));

    try {
      await persistProjects(nextProjects, { showToast: false });
      resetModal();
      toast.success(
        isVerified
          ? t('companyProjects.projectsSubmittedForApproval')
          : t('companyProjects.projectsUpdated'),
      );
    } catch {
      resetModal();
    }
  };

  const handleDelete = (index: number) => {
    Alert.alert(t('companyProjects.deleteProject'), t('companyProjects.deleteProjectConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('companyProjects.deleteProject'),
        style: 'destructive',
        onPress: () => {
          const nextProjects = projects.filter((_, i) => i !== index);
          void persistProjects(nextProjects, { successType: 'deleted' });
        },
      },
    ]);
  };

  if (!company) {
    return (
      <Text
        className="text-sm text-ink-muted dark:text-white/70"
        style={{ fontFamily: getFontFamily('regular') }}
      >
        {t('companyProjects.noCompany')}
      </Text>
    );
  }

  return (
    <>
      <ProfileFormSection
        title={t('companyProjects.title')}
        subtitle={t('companyProjects.subtitle')}
        banner={
          isVerified && hasPendingProjects ? (
            <Text
              className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
              style={{ fontFamily: getFontFamily('regular') }}
            >
              {t('companyProjects.projectsPendingApproval')}
            </Text>
          ) : undefined
        }
      >
        <Button
          title={t('companyProjects.addProject')}
          onPress={openAddModal}
          disabled={saving}
          variant="outline"
        />

        {projects.length === 0 ? (
          <Text
            className="py-6 text-center text-sm text-ink-muted dark:text-white/60"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {t('companyProjects.noProjectsYet')}
          </Text>
        ) : (
          <View className="gap-4">
            {projects.map((project, index) => (
              <View
                key={project.slug ?? `project-${index}`}
                className="overflow-hidden rounded-2xl border border-slate-200 dark:border-dm-border"
              >
                <View className="relative h-36">
                  {project.imageUrl || project.imageFile?.uri ? (
                    <Image
                      source={{ uri: project.imageFile?.uri ?? project.imageUrl }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="h-full w-full items-center justify-center bg-slate-100 dark:bg-dm-elevated">
                      <Ionicons name="image-outline" size={28} color="#94a3b8" />
                    </View>
                  )}
                  {isVerified && project.status ? (
                    <View
                      className={cn(
                        'absolute left-2 top-2 rounded-full px-2.5 py-0.5',
                        statusStyles[project.status],
                      )}
                    >
                      <Text
                        className="text-xs font-medium"
                        style={{ fontFamily: getFontFamily('medium') }}
                      >
                        {t(`companyProjects.projectStatus.${project.status}`)}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View className="gap-3 p-4">
                  <Text
                    className="text-base font-semibold text-ink dark:text-white"
                    style={{ fontFamily: getFontFamily('semibold') }}
                  >
                    {project.title}
                  </Text>

                  {project.description ? (
                    <Text
                      className="text-sm text-ink-muted dark:text-white/70"
                      style={{ fontFamily: getFontFamily('regular') }}
                      numberOfLines={2}
                    >
                      {project.description}
                    </Text>
                  ) : null}

                  {project.customServices.length > 0 ? (
                    <View className="flex-row flex-wrap gap-1.5">
                      {project.customServices.slice(0, 3).map((service) => (
                        <View
                          key={service}
                          className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-dm-elevated"
                        >
                          <Text
                            className="text-xs text-ink-muted dark:text-white/70"
                            style={{ fontFamily: getFontFamily('regular') }}
                          >
                            {service}
                          </Text>
                        </View>
                      ))}
                      {project.customServices.length > 3 ? (
                        <Text
                          className="text-xs text-ink-muted dark:text-white/60"
                          style={{ fontFamily: getFontFamily('regular') }}
                        >
                          +{project.customServices.length - 3}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  {isVerified && project.status === CompanyProjectStatus.REJECTED ? (
                    <Text
                      className="text-sm text-red-600 dark:text-red-400"
                      style={{ fontFamily: getFontFamily('regular') }}
                    >
                      {t('companyProjects.projectRejectedHint')}
                    </Text>
                  ) : null}

                  <View className="flex-row gap-2">
                    <Button
                      title={t('companyProjects.editProject')}
                      variant="outline"
                      onPress={() => openEditModal(index)}
                      disabled={saving}
                      className="flex-1"
                    />
                    <Pressable
                      onPress={() => handleDelete(index)}
                      disabled={saving}
                      accessibilityRole="button"
                      accessibilityLabel={t('companyProjects.deleteProject')}
                      className="h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-dm-border dark:bg-dm-elevated"
                    >
                      <Ionicons name="trash-outline" size={18} color="#dc2626" />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {saving ? (
          <View className="flex-row items-center justify-center gap-2 py-2">
            <ActivityIndicator size="small" color="#8E2157" />
            <Text
              className="text-sm text-ink-muted dark:text-white/60"
              style={{ fontFamily: getFontFamily('regular') }}
            >
              {t('companyProjects.saving')}
            </Text>
          </View>
        ) : null}
      </ProfileFormSection>

      <ProjectFormModal
        visible={modalOpen}
        title={
          editingIndex === null ? t('companyProjects.addProject') : t('companyProjects.editProject')
        }
        draft={modalDraft}
        saving={saving}
        isVerified={isVerified}
        onChange={(patch) => setModalDraft((current) => ({ ...current, ...patch }))}
        onClose={closeModal}
        onSave={() => void handleModalSave()}
      />
    </>
  );
}
