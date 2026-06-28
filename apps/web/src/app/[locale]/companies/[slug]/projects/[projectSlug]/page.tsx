import { CompanySocialLinksRow } from '@/components/company/company-social-links-row';
import { fetchCompanyBySlug } from '@/lib/companies-data';
import { scrollRevealProps, scrollStaggerDelay } from '@/lib/scroll-reveal';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Building2, Calendar, MapPin, User } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { JSX } from 'react';

export const dynamic = 'force-dynamic';

interface ProjectPageProps {
  params: Promise<{ slug: string; projectSlug: string }>;
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug, projectSlug } = await params;
  const company = await fetchCompanyBySlug(slug);
  const project = company?.projects.find((item) => item.slug === projectSlug);

  if (!company || !project) {
    return { title: 'Project' };
  }

  return {
    title: `${project.title} | ${company.name}`,
    description: project.description ?? `${project.title} by ${company.name}`,
  };
}

export default async function CompanyProjectPage({
  params,
}: ProjectPageProps): Promise<JSX.Element> {
  const t = await getTranslations('companyPage');
  const { slug, projectSlug } = await params;
  const company = await fetchCompanyBySlug(slug);

  if (!company) {
    notFound();
  }

  const project = company.projects.find((item) => item.slug === projectSlug);

  if (!project) {
    notFound();
  }

  const serviceLabels =
    project.customServices.length > 0
      ? project.customServices
      : project.serviceIds.length > 0
        ? company.serviceItems
            .filter((item) => project.serviceIds.includes(item.id))
            .map((item) => item.label)
        : [];

  const projectDateLabel = project.projectDate
    ? new Date(project.projectDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="mx-auto max-w-page px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div {...scrollRevealProps('fade-in')}>
        <Link
          href={`/companies/${slug}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-brand-500 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t('backToCompany', { name: company.name })}
        </Link>
      </div>

      <div
        {...scrollRevealProps('fade-up')}
        className="overflow-hidden rounded-2xl border border-subtle bg-white shadow-card dark:bg-dm-surface"
      >
        <div className="relative h-56 overflow-hidden sm:h-72 lg:h-96">
          <img src={project.imageUrl} alt="" className="h-full w-full object-cover" />
        </div>

        <div className="p-6 sm:p-8 lg:p-10">
          <p className="text-sm font-medium text-brand-500">{company.name}</p>
          <h1 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">{project.title}</h1>

          {project.description ? (
            <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-secondary sm:text-base">
              {project.description}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-secondary">
            {project.clientName ? (
              <span className="inline-flex items-center gap-1.5">
                <User className="h-4 w-4 shrink-0" aria-hidden />
                {t('projectClient', { name: project.clientName })}
              </span>
            ) : null}
            {project.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                {project.location}
              </span>
            ) : null}
            {projectDateLabel ? (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                {projectDateLabel}
              </span>
            ) : null}
          </div>

          {serviceLabels.length > 0 ? (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-primary">{t('projectServices')}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {serviceLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-default bg-slate-100 px-4 py-2 text-sm font-medium text-primary dark:bg-dm-elevated"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {project.demoImages.length > 0 ? (
            <div className="mt-8">
              <h2 className="text-sm font-semibold text-primary">{t('projectGallery')}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {project.demoImages.map((imageUrl, index) => (
                  <div
                    key={`${imageUrl}-${index}`}
                    {...scrollRevealProps('fade-up', scrollStaggerDelay(index))}
                    className="overflow-hidden rounded-xl"
                  >
                    <img src={imageUrl} alt="" className="h-48 w-full object-cover sm:h-56" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {project.projectUrl ? (
            <a
              href={project.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-brand-500 hover:underline"
            >
              {t('projectExternalLink')}
            </a>
          ) : null}
        </div>
      </div>

      <div
        {...scrollRevealProps('fade-up', 120)}
        className="mt-8 rounded-2xl border border-subtle bg-white p-6 dark:bg-dm-surface sm:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-primary">{company.name}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-secondary">
              <Building2 className="h-4 w-4 shrink-0" aria-hidden />
              {company.city}, {company.country}
            </p>
          </div>
          <CompanySocialLinksRow socialLinks={company.socialLinks} />
        </div>
        <Link
          href={`/companies/${slug}`}
          className="mt-4 inline-block text-sm font-medium text-brand-500 hover:underline"
        >
          {t('viewCompanyProfile')}
        </Link>
      </div>
    </div>
  );
}
