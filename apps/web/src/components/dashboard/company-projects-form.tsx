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
import { Plus, Trash2, X } from 'lucide-react';
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

function CompanyProjectsFormFields({ company }: { company: CompanyProfileDetail }) {
  const t = useTranslations('profilePage');
  const { refreshOnboarding } = useProfile();
  const [projects, setProjects] = useState<ProjectDraft[]>(() => buildProjectDrafts(company));
  const [submitting, setSubmitting] = useState(false);
  const isVerified = company.verificationStatus === 'approved';

  const coverPreviews = useMemo(
    () =>
      projects.map((project) =>
        project.imageFile ? URL.createObjectURL(project.imageFile) : project.imageUrl || null,
      ),
    [projects],
  );

  const demoPreviews = useMemo(
    () =>
      projects.map((project) => [
        ...project.demoImages,
        ...project.demoImageFiles.map((file) => URL.createObjectURL(file)),
      ]),
    [projects],
  );

  useEffect(() => {
    return () => {
      coverPreviews.forEach((url) => {
        if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
      });
      demoPreviews.flat().forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [coverPreviews, demoPreviews]);

  const hasPendingProjects = projects.some(
    (project) => project.status === CompanyProjectStatus.PENDING,
  );

  const updateProject = (index: number, patch: Partial<ProjectDraft>) => {
    setProjects((current) =>
      current.map((project, i) => (i === index ? { ...project, ...patch } : project)),
    );
  };

  const addProject = () => {
    if (projects.length >= 12) return;
    setProjects((current) => [...current, createEmptyProject()]);
  };

  const removeProject = (index: number) => {
    setProjects((current) => current.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setSubmitting(true);
    try {
      const token = await ensureValidAccessToken();
      if (!token) throw new Error(t('sessionExpired'));

      await waitForFirebaseUser();

      const projectPayload: UpdateCompanyProjectInput[] = [];

      for (const project of projects) {
        const title = project.title.trim();
        const hasAnyValue =
          title ||
          project.description.trim() ||
          project.projectUrl.trim() ||
          project.imageUrl ||
          project.imageFile ||
          project.demoImages.length > 0 ||
          project.demoImageFiles.length > 0 ||
          project.customServices.length > 0;

        if (!hasAnyValue) continue;

        if (!title) {
          toast.error(t('projectTitleRequired'));
          return;
        }

        if (project.customServices.length > 5) {
          toast.error(t('projectServicesMax'));
          return;
        }

        const projectUrl = project.projectUrl.trim();
        if (projectUrl && !isValidUrl(projectUrl)) {
          toast.error(t('projectUrlInvalid'));
          return;
        }

        let imageUrl = project.imageUrl.trim();
        if (project.imageFile) {
          imageUrl = await uploadUserFile(company.id, 'company/projects', project.imageFile);
        }

        if (!imageUrl) {
          toast.error(t('projectImageRequired'));
          return;
        }

        const demoImages = [...project.demoImages];
        for (const file of project.demoImageFiles) {
          if (demoImages.length >= 8) break;
          const demoFile = new File([file], `demo-${file.name}`, { type: file.type });
          demoImages.push(await uploadUserFile(company.id, 'company/projects', demoFile));
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

      await onboardingApi.updateCompany({ projects: projectPayload });

      await refreshOnboarding();
      toast.success(isVerified ? t('projectsSubmittedForApproval') : t('projectsUpdated'));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('saveError');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl surface-card border p-6 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-primary">{t('companyProjects')}</h2>
        <p className="mt-1 text-sm text-secondary">{t('companyProjectsHint')}</p>
        {isVerified && hasPendingProjects ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
            {t('projectsPendingApproval')}
          </p>
        ) : null}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-end">
          <Button type="button" variant="outline" size="sm" onClick={addProject}>
            <Plus className="h-4 w-4" />
            {t('addProject')}
          </Button>
        </div>
        {projects.length === 0 ? (
          <p className="text-sm text-secondary">{t('noProjectsYet')}</p>
        ) : (
          <div className="space-y-4">
            {projects.map((project, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200 p-4 dark:border-dm-border"
              >
                <div className="flex items-start justify-between gap-3">
                  <Field label={t('projectTitle')} required className="flex-1">
                    <Input
                      value={project.title}
                      onChange={(e) => updateProject(index, { title: e.target.value })}
                      className="h-10"
                      maxLength={200}
                    />
                  </Field>
                  <div className="mt-6 flex shrink-0 items-center gap-2">
                    {isVerified && project.status ? (
                      <span
                        className={cn(
                          'inline-flex rounded-full px-3 py-1 text-xs font-medium',
                          projectStatusStyles[project.status],
                        )}
                      >
                        {t(`projectStatus.${project.status}`)}
                      </span>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-10 w-10 px-0"
                      onClick={() => removeProject(index)}
                      aria-label={t('removeProject')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {isVerified && project.status === CompanyProjectStatus.REJECTED ? (
                  <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                    {t('projectRejectedHint')}
                  </p>
                ) : null}

                <Field label={t('projectDescription')} className="mt-3">
                  <textarea
                    value={project.description}
                    onChange={(e) => updateProject(index, { description: e.target.value })}
                    rows={3}
                    maxLength={2000}
                    className="textarea-field w-full"
                  />
                </Field>

                <Field label={t('projectCoverImage')} className="mt-3" required>
                  {coverPreviews[index] ? (
                    <ImagePreview
                      src={coverPreviews[index]!}
                      alt=""
                      onRemove={() => updateProject(index, { imageUrl: '', imageFile: null })}
                      removeLabel={t('removeProjectImage')}
                      className="mb-2 h-24 w-full"
                    />
                  ) : null}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      updateProject(index, {
                        imageFile: file,
                        imageUrl: file ? '' : project.imageUrl,
                      });
                    }}
                    className="h-10"
                  />
                </Field>

                <Field label={t('projectDemoImages')} className="mt-3">
                  {(demoPreviews[index]?.length ?? 0) > 0 ? (
                    <div className="mb-2 grid grid-cols-4 gap-2">
                      {(demoPreviews[index] ?? []).map((url, imageIndex) => {
                        const existingCount = project.demoImages.length;
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
                                updateProject(index, {
                                  demoImages: project.demoImages.filter((_, i) => i !== imageIndex),
                                });
                                return;
                              }

                              const fileIndex = imageIndex - existingCount;
                              updateProject(index, {
                                demoImageFiles: project.demoImageFiles.filter(
                                  (_, i) => i !== fileIndex,
                                ),
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
                    disabled={project.demoImages.length + project.demoImageFiles.length >= 8}
                    onChange={(e) => {
                      const remaining = Math.max(
                        0,
                        8 - project.demoImages.length - project.demoImageFiles.length,
                      );
                      const files = Array.from(e.target.files ?? []).slice(0, remaining);
                      updateProject(index, {
                        demoImageFiles: [...project.demoImageFiles, ...files],
                      });
                      e.target.value = '';
                    }}
                    className="h-10"
                  />
                  <p className="mt-1 text-xs text-secondary">{t('projectDemoImagesHint')}</p>
                </Field>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label={t('projectClientName')}>
                    <Input
                      value={project.clientName}
                      onChange={(e) => updateProject(index, { clientName: e.target.value })}
                      className="h-10"
                      maxLength={200}
                    />
                  </Field>
                  <Field label={t('projectLocation')}>
                    <Input
                      value={project.location}
                      onChange={(e) => updateProject(index, { location: e.target.value })}
                      className="h-10"
                      maxLength={200}
                    />
                  </Field>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label={t('projectDate')}>
                    <Input
                      type="date"
                      value={project.projectDate}
                      onChange={(e) => updateProject(index, { projectDate: e.target.value })}
                      className="h-10"
                    />
                  </Field>
                  <Field label={t('projectUrl')}>
                    <Input
                      value={project.projectUrl}
                      onChange={(e) => updateProject(index, { projectUrl: e.target.value })}
                      placeholder="https://example.com/project"
                      className="h-10"
                      maxLength={2048}
                    />
                  </Field>
                </div>

                <div className="mt-3">
                  <CustomServicesInput
                    label={t('projectServices')}
                    hint={t('projectServicesCustomHint')}
                    services={project.customServices}
                    onChange={(customServices) => updateProject(index, { customServices })}
                    addLabel={t('addService')}
                    removeLabel={t('removeService')}
                    placeholder={t('servicePlaceholder')}
                    maxServices={5}
                    maxReachedMessage={t('projectServicesMax')}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? t('saving') : t('saveProjects')}
      </Button>
    </form>
  );
}

export function CompanyProjectsForm() {
  const { onboarding, isLoading: profileLoading } = useProfile();
  const company = onboarding?.company;

  if (profileLoading) return <DashboardProfileLoading />;
  if (!company) return null;

  return <CompanyProjectsFormFields key={company.updatedAt} company={company} />;
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
