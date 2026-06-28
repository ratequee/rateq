'use client';

import { CatalogMultiSelect } from '@/components/profile/catalog-multi-select';
import { DashboardProfileLoading } from '@/components/dashboard/dashboard-profile-loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/components/providers/profile-provider';
import { fetchCompanyCatalogClient } from '@/lib/company-catalog-api';
import { uploadUserFile } from '@/lib/firebase/storage';
import { onboardingApi } from '@/lib/onboarding-api';
import { ApiError } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';
import type {
  CompanyCatalogItemPublic,
  CompanyProfileDetail,
  UpdateCompanyProjectInput,
} from '@rateq/types';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
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
  serviceIds: string[];
  imageFile: File | null;
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
    serviceIds: [],
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
    serviceIds: project.serviceIds ?? [],
    imageFile: null,
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

function CompanyProjectsFormFields({ company }: { company: CompanyProfileDetail }) {
  const t = useTranslations('profilePage');
  const { refreshOnboarding } = useProfile();
  const [projects, setProjects] = useState<ProjectDraft[]>(() => buildProjectDrafts(company));
  const [catalogServices, setCatalogServices] = useState<CompanyCatalogItemPublic[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetchCompanyCatalogClient('service').then(setCatalogServices);
  }, []);

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
          project.demoImageFiles.length > 0;

        if (!hasAnyValue) continue;

        if (!title) {
          toast.error(t('projectTitleRequired'));
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
          demoImages.push(await uploadUserFile(company.id, 'company/projects/demo', file));
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
          serviceIds: project.serviceIds,
        });
      }

      await onboardingApi.updateCompany({ projects: projectPayload });

      await refreshOnboarding();
      toast.success(t('projectsUpdated'));
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
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-6 h-10 w-10 shrink-0 px-0"
                    onClick={() => removeProject(index)}
                    aria-label={t('removeProject')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

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
                  {project.imageUrl && !project.imageFile ? (
                    <img
                      src={project.imageUrl}
                      alt=""
                      className="mb-2 h-24 w-full rounded-lg object-cover"
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
                  {project.demoImages.length > 0 ? (
                    <div className="mb-2 grid grid-cols-4 gap-2">
                      {project.demoImages.map((url, imageIndex) => (
                        <img
                          key={`${url}-${imageIndex}`}
                          src={url}
                          alt=""
                          className="h-16 w-full rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  ) : null}
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []).slice(
                        0,
                        Math.max(0, 8 - project.demoImages.length),
                      );
                      updateProject(index, { demoImageFiles: files });
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
                  <CatalogMultiSelect
                    label={t('projectServices')}
                    hint={t('projectServicesHint')}
                    items={catalogServices}
                    selectedIds={project.serviceIds}
                    onChange={(serviceIds) => updateProject(index, { serviceIds })}
                    maxItems={10}
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
