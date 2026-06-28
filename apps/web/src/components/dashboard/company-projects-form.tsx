'use client';

import { DashboardProfileLoading } from '@/components/dashboard/dashboard-profile-loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/components/providers/profile-provider';
import { uploadUserFile } from '@/lib/firebase/storage';
import { waitForFirebaseUser } from '@/lib/firebase/wait-for-user';
import { onboardingApi } from '@/lib/onboarding-api';
import { ApiError } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';
import { cn } from '@/lib/utils';
import type { CompanyProfileDetail, UpdateCompanyProjectInput } from '@rateq/types';
import { CompanyProjectStatus } from '@rateq/types';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface ProjectDraft {
  slug?: string;
  title: string;
  description: string;
  imageUrl: string;
  projectUrl: string;
  demoImages: string[];
  demoImageFiles: File[];
  clientName: string;
  location: string;
  projectDate: string;
  customServices: string[];
  imageFile: File | null;
  status?: CompanyProjectStatus;
}

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

const projectStatusStyles: Record<CompanyProjectStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  APPROVED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  REJECTED: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400',
};

function ImagePreview({
  src,
  alt,
  onRemove,
  removeLabel,
  className,
}: {
  src: string;
  alt: string;
  onRemove: () => void;
  removeLabel: string;
  className?: string;
}) {
  return (
    <div className={cn('group relative overflow-hidden rounded-lg', className)}>
      <img src={src} alt={alt} className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="absolute end-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function CustomServicesInput({
  label,
  hint,
  services,
  onChange,
  addLabel,
  removeLabel,
  placeholder,
  maxServices,
  maxReachedMessage,
}: {
  label: string;
  hint: string;
  services: string[];
  onChange: (services: string[]) => void;
  addLabel: string;
  removeLabel: string;
  placeholder: string;
  maxServices: number;
  maxReachedMessage: string;
}) {
  const [draft, setDraft] = useState('');

  const addService = () => {
    const value = draft.trim();
    if (!value) return;
    if (services.length >= maxServices) {
      toast.error(maxReachedMessage);
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
    <div>
      <label className="mb-1.5 block text-sm font-medium text-primary">{label}</label>
      <p className="mb-2 text-xs text-secondary">{hint}</p>
      {services.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {services.map((service, index) => (
            <span
              key={`${service}-${index}`}
              className="inline-flex items-center gap-1 rounded-full border border-default bg-slate-100 px-3 py-1 text-sm text-primary dark:bg-dm-elevated"
            >
              {service}
              <button
                type="button"
                onClick={() => onChange(services.filter((_, i) => i !== index))}
                aria-label={removeLabel}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-secondary hover:bg-slate-200 dark:hover:bg-dm-surface"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addService();
            }
          }}
          placeholder={placeholder}
          className="h-10"
          maxLength={100}
          disabled={services.length >= maxServices}
        />
        <Button
          type="button"
          variant="outline"
          className="h-10 shrink-0"
          onClick={addService}
          disabled={services.length >= maxServices}
        >
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-primary">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {children}
    </div>
  );
}

function ProjectFormModal({
  open,
  title,
  draft,
  onChange,
  onClose,
  onSave,
  saving,
  isVerified,
  t,
}: {
  open: boolean;
  title: string;
  draft: ProjectDraft;
  onChange: (patch: Partial<ProjectDraft>) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  isVerified: boolean;
  t: ReturnType<typeof useTranslations<'profilePage'>>;
}) {
  const coverPreview = useMemo(
    () => (draft.imageFile ? URL.createObjectURL(draft.imageFile) : draft.imageUrl || null),
    [draft.imageFile, draft.imageUrl],
  );

  const demoPreviewUrls = useMemo(
    () => [...draft.demoImages, ...draft.demoImageFiles.map((file) => URL.createObjectURL(file))],
    [draft.demoImages, draft.demoImageFiles],
  );

  useEffect(() => {
    return () => {
      if (coverPreview?.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
      demoPreviewUrls.forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [coverPreview, demoPreviewUrls]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl dark:bg-dm-surface">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-subtle px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-primary">{title}</h3>
            {isVerified ? (
              <p className="mt-1 text-sm text-secondary">{t('projectModalModerationHint')}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1 text-ink-muted hover:bg-slate-100 dark:hover:bg-dm-elevated"
            aria-label={t('cancel')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <Field label={t('projectTitle')} required>
            <Input
              value={draft.title}
              onChange={(e) => onChange({ title: e.target.value })}
              className="h-10"
              maxLength={200}
            />
          </Field>

          <Field label={t('projectDescription')}>
            <textarea
              value={draft.description}
              onChange={(e) => onChange({ description: e.target.value })}
              rows={3}
              maxLength={2000}
              className="textarea-field w-full"
            />
          </Field>

          <Field label={t('projectCoverImage')} required>
            {coverPreview ? (
              <ImagePreview
                src={coverPreview}
                alt=""
                onRemove={() => onChange({ imageUrl: '', imageFile: null })}
                removeLabel={t('removeProjectImage')}
                className="mb-2 h-32 w-full"
              />
            ) : null}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                onChange({
                  imageFile: file,
                  imageUrl: file ? '' : draft.imageUrl,
                });
              }}
              className="h-10"
            />
          </Field>

          <Field label={t('projectDemoImages')}>
            {demoPreviewUrls.length > 0 ? (
              <div className="mb-2 grid grid-cols-4 gap-2">
                {demoPreviewUrls.map((url, imageIndex) => {
                  const existingCount = draft.demoImages.length;
                  const isExisting = imageIndex < existingCount;

                  return (
                    <ImagePreview
                      key={`${url}-${imageIndex}`}
                      src={url}
                      alt=""
                      className="h-16 w-full"
                      removeLabel={t('removeProjectImage')}
                      onRemove={() => {
                        if (isExisting) {
                          onChange({
                            demoImages: draft.demoImages.filter((_, i) => i !== imageIndex),
                          });
                          return;
                        }

                        const fileIndex = imageIndex - existingCount;
                        onChange({
                          demoImageFiles: draft.demoImageFiles.filter((_, i) => i !== fileIndex),
                        });
                      }}
                    />
                  );
                })}
              </div>
            ) : null}
            <Input
              type="file"
              accept="image/*"
              multiple
              disabled={draft.demoImages.length + draft.demoImageFiles.length >= 8}
              onChange={(e) => {
                const remaining = Math.max(
                  0,
                  8 - draft.demoImages.length - draft.demoImageFiles.length,
                );
                const files = Array.from(e.target.files ?? []).slice(0, remaining);
                onChange({
                  demoImageFiles: [...draft.demoImageFiles, ...files],
                });
                e.target.value = '';
              }}
              className="h-10"
            />
            <p className="mt-1 text-xs text-secondary">{t('projectDemoImagesHint')}</p>
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('projectClientName')}>
              <Input
                value={draft.clientName}
                onChange={(e) => onChange({ clientName: e.target.value })}
                className="h-10"
                maxLength={200}
              />
            </Field>
            <Field label={t('projectLocation')}>
              <Input
                value={draft.location}
                onChange={(e) => onChange({ location: e.target.value })}
                className="h-10"
                maxLength={200}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('projectDate')}>
              <Input
                type="date"
                value={draft.projectDate}
                onChange={(e) => onChange({ projectDate: e.target.value })}
                className="h-10"
              />
            </Field>
            <Field label={t('projectUrl')}>
              <Input
                value={draft.projectUrl}
                onChange={(e) => onChange({ projectUrl: e.target.value })}
                placeholder="https://example.com/project"
                className="h-10"
                maxLength={2048}
              />
            </Field>
          </div>

          <CustomServicesInput
            label={t('projectServices')}
            hint={t('projectServicesCustomHint')}
            services={draft.customServices}
            onChange={(customServices) => onChange({ customServices })}
            addLabel={t('addService')}
            removeLabel={t('removeService')}
            placeholder={t('servicePlaceholder')}
            maxServices={5}
            maxReachedMessage={t('projectServicesMax')}
          />
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-subtle px-6 py-4">
          <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="button" disabled={saving} onClick={onSave}>
            {saving ? t('saving') : t('saveProject')}
          </Button>
        </div>
      </div>
    </div>
  );
}

async function buildProjectPayload(
  companyId: string,
  projects: ProjectDraft[],
  t: ReturnType<typeof useTranslations<'profilePage'>>,
): Promise<UpdateCompanyProjectInput[] | null> {
  const projectPayload: UpdateCompanyProjectInput[] = [];

  for (const project of projects) {
    const title = project.title.trim();
    if (!title) continue;

    if (project.customServices.length > 5) {
      toast.error(t('projectServicesMax'));
      return null;
    }

    const projectUrl = project.projectUrl.trim();
    if (projectUrl && !isValidUrl(projectUrl)) {
      toast.error(t('projectUrlInvalid'));
      return null;
    }

    let imageUrl = project.imageUrl.trim();
    if (project.imageFile) {
      imageUrl = await uploadUserFile(companyId, 'company/projects', project.imageFile);
    }

    if (!imageUrl) {
      toast.error(t('projectImageRequired'));
      return null;
    }

    const demoImages = [...project.demoImages];
    for (const file of project.demoImageFiles) {
      if (demoImages.length >= 8) break;
      const demoFile = new File([file], `demo-${file.name}`, { type: file.type });
      demoImages.push(await uploadUserFile(companyId, 'company/projects', demoFile));
    }

    projectPayload.push({
      slug: project.slug,
      title,
      description: project.description.trim() || undefined,
      imageUrl,
      projectUrl: projectUrl || undefined,
      demoImages: demoImages.slice(0, 8),
      clientName: project.clientName.trim() || undefined,
      location: project.location.trim() || undefined,
      projectDate: project.projectDate || undefined,
      customServices: project.customServices,
    });
  }

  return projectPayload;
}

function CompanyProjectsFormFields({ company }: { company: CompanyProfileDetail }) {
  const t = useTranslations('profilePage');
  const { refreshOnboarding } = useProfile();
  const [projects, setProjects] = useState<ProjectDraft[]>(() => buildProjectDrafts(company));
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [modalDraft, setModalDraft] = useState<ProjectDraft>(createEmptyProject());
  const isVerified = company.verificationStatus === 'approved';

  const hasPendingProjects = projects.some(
    (project) => project.status === CompanyProjectStatus.PENDING,
  );

  const persistProjects = async (
    nextProjects: ProjectDraft[],
    successMessage: 'saved' | 'deleted' = 'saved',
  ) => {
    setSaving(true);
    try {
      const token = await ensureValidAccessToken();
      if (!token) throw new Error(t('sessionExpired'));

      await waitForFirebaseUser();

      const projectPayload = await buildProjectPayload(company.id, nextProjects, t);
      if (!projectPayload) return;

      await onboardingApi.updateCompany({ projects: projectPayload });
      await refreshOnboarding();
      setProjects(
        nextProjects.map((project) => ({ ...project, demoImageFiles: [], imageFile: null })),
      );
      if (successMessage === 'deleted') {
        toast.success(t('projectDeleted'));
      } else {
        toast.success(isVerified ? t('projectsSubmittedForApproval') : t('projectsUpdated'));
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('saveError');
      toast.error(message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const openAddModal = () => {
    if (projects.length >= 12) {
      toast.error(t('projectLimitReached'));
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
    setModalDraft({
      ...project,
      demoImageFiles: [],
      imageFile: null,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingIndex(null);
    setModalDraft(createEmptyProject());
  };

  const handleModalSave = async () => {
    const title = modalDraft.title.trim();
    if (!title) {
      toast.error(t('projectTitleRequired'));
      return;
    }

    const hasImage = Boolean(modalDraft.imageUrl.trim() || modalDraft.imageFile);
    if (!hasImage) {
      toast.error(t('projectImageRequired'));
      return;
    }

    const nextProjects =
      editingIndex === null
        ? [...projects, modalDraft]
        : projects.map((project, index) => (index === editingIndex ? modalDraft : project));

    try {
      await persistProjects(nextProjects);
      closeModal();
    } catch {
      // toast handled in persistProjects
    }
  };

  const handleDelete = async (index: number) => {
    if (!window.confirm(t('deleteProjectConfirm'))) return;

    const nextProjects = projects.filter((_, i) => i !== index);
    try {
      await persistProjects(nextProjects, 'deleted');
    } catch {
      // toast handled in persistProjects
    }
  };

  return (
    <>
      <div className="space-y-5 rounded-2xl surface-card border p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-primary">{t('companyProjects')}</h2>
            <p className="mt-1 text-sm text-secondary">{t('companyProjectsHint')}</p>
            {isVerified && hasPendingProjects ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
                {t('projectsPendingApproval')}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openAddModal}
            disabled={saving}
          >
            <Plus className="h-4 w-4" />
            {t('addProject')}
          </Button>
        </div>

        {projects.length === 0 ? (
          <p className="py-8 text-center text-sm text-secondary">{t('noProjectsYet')}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((project, index) => (
              <article
                key={project.slug ?? `project-${index}`}
                className="overflow-hidden rounded-xl border border-slate-200 dark:border-dm-border"
              >
                <div className="relative h-36">
                  <img src={project.imageUrl} alt="" className="h-full w-full object-cover" />
                  {isVerified && project.status ? (
                    <span
                      className={cn(
                        'absolute start-2 top-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                        projectStatusStyles[project.status],
                      )}
                    >
                      {t(`projectStatus.${project.status}`)}
                    </span>
                  ) : null}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-primary">{project.title}</h3>
                  {project.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-secondary">
                      {project.description}
                    </p>
                  ) : null}
                  {project.customServices.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {project.customServices.slice(0, 3).map((service) => (
                        <span
                          key={service}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-secondary dark:bg-dm-elevated"
                        >
                          {service}
                        </span>
                      ))}
                      {project.customServices.length > 3 ? (
                        <span className="text-xs text-secondary">
                          +{project.customServices.length - 3}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  {isVerified && project.status === CompanyProjectStatus.REJECTED ? (
                    <p className="mt-2 text-xs text-red-700 dark:text-red-300">
                      {t('projectRejectedHint')}
                    </p>
                  ) : null}
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={saving}
                      onClick={() => openEditModal(index)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      {t('editProject')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={saving}
                      onClick={() => void handleDelete(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t('removeProject')}
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <ProjectFormModal
        open={modalOpen}
        title={editingIndex === null ? t('addProject') : t('editProject')}
        draft={modalDraft}
        onChange={(patch) => setModalDraft((current) => ({ ...current, ...patch }))}
        onClose={closeModal}
        onSave={() => void handleModalSave()}
        saving={saving}
        isVerified={isVerified}
        t={t}
      />
    </>
  );
}

export function CompanyProjectsForm() {
  const { onboarding, isLoading: profileLoading } = useProfile();
  const company = onboarding?.company;

  if (profileLoading) return <DashboardProfileLoading />;
  if (!company) return null;

  return <CompanyProjectsFormFields key={company.updatedAt} company={company} />;
}
