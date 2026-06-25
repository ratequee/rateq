'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/components/providers/profile-provider';
import { uploadUserFile } from '@/lib/firebase/storage';
import { onboardingApi } from '@/lib/onboarding-api';
import { ApiError } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';
import type { UpdateCompanyProjectInput } from '@rateq/types';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ProjectDraft {
  title: string;
  imageUrl: string;
  projectUrl: string;
  imageFile: File | null;
}

function createEmptyProject(): ProjectDraft {
  return { title: '', imageUrl: '', projectUrl: '', imageFile: null };
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function CompanyProjectsForm() {
  const t = useTranslations('profilePage');
  const { onboarding, refreshOnboarding } = useProfile();
  const company = onboarding?.company;

  const [projects, setProjects] = useState<ProjectDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!company) return;
    setProjects(
      company.projects?.length
        ? company.projects.map((project) => ({
            title: project.title,
            imageUrl: project.imageUrl,
            projectUrl: project.projectUrl,
            imageFile: null,
          }))
        : [],
    );
  }, [company]);

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
    if (!company) return;

    setSubmitting(true);
    try {
      const token = await ensureValidAccessToken();
      if (!token) throw new Error(t('sessionExpired'));

      const projectPayload: UpdateCompanyProjectInput[] = [];

      for (const project of projects) {
        const title = project.title.trim();
        const projectUrl = project.projectUrl.trim();
        const hasAnyValue = title || projectUrl || project.imageUrl || project.imageFile;

        if (!hasAnyValue) continue;

        if (!title) {
          toast.error(t('projectTitleRequired'));
          return;
        }

        if (!projectUrl || !isValidUrl(projectUrl)) {
          toast.error(t('projectUrlRequired'));
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

        projectPayload.push({ title, imageUrl, projectUrl });
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

  if (!company) return null;

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
              <div key={index} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <Field label={t('projectTitle')} required>
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
                <Field label={t('projectUrl')} className="mt-3" required>
                  <Input
                    value={project.projectUrl}
                    onChange={(e) => updateProject(index, { projectUrl: e.target.value })}
                    placeholder="https://example.com/project"
                    className="h-10"
                    maxLength={2048}
                  />
                </Field>
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
