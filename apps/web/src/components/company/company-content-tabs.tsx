'use client';

import { CompanyReviewsSectionClient } from '@/components/company/company-reviews-section-client';
import { CompanyReviewsHubLayout } from '@/components/company/company-reviews-hub-layout';
import { cn } from '@/lib/utils';
import type {
  CategoryServicePublic,
  CompanyCatalogLabel,
  CompanyProjectPublic,
  CompanyPublic,
  ReviewPublic,
} from '@rateq/types';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

type CompanyTab = 'reviews' | 'projects' | 'services';

interface CompanyContentTabsProps {
  company: CompanyPublic;
  reviews: ReviewPublic[];
  topMentions: string[];
  categoryServices: CategoryServicePublic[];
  projects: CompanyProjectPublic[];
  serviceItems?: CompanyCatalogLabel[];
  activityItems?: CompanyCatalogLabel[];
  services: string[];
}

function ProjectsGrid({ projects }: { projects: CompanyProjectPublic[] }) {
  const t = useTranslations('companyPage');
  const visibleProjects = projects.filter((project) => project.projectUrl.trim());

  if (visibleProjects.length === 0) {
    return <p className="py-12 text-center text-sm text-ink-muted">{t('noProjects')}</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {visibleProjects.map((project) => (
        <a
          key={project.id}
          href={project.projectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-slate-800"
        >
          <div className="relative h-40 overflow-hidden sm:h-44">
            <img src={project.imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="flex min-h-[72px] items-center bg-brand-500 px-4 py-3">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">
              {project.title}
            </h3>
          </div>
        </a>
      ))}
    </div>
  );
}

function CatalogPills({
  title,
  items,
  fallback,
}: {
  title: string;
  items: CompanyCatalogLabel[];
  fallback: string[];
}) {
  const labels = items.length > 0 ? items.map((item) => item.label) : fallback;

  if (labels.length === 0) return null;

  return (
    <div className="mb-8 last:mb-0">
      <h3 className="mb-3 text-sm font-semibold text-primary">{title}</h3>
      <div className="flex flex-wrap gap-3">
        {labels.map((label, index) => (
          <span
            key={`${label}-${index}`}
            className="rounded-full border border-default bg-slate-100 px-5 py-2.5 text-sm font-medium text-primary dark:bg-slate-800"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function ServicesTabContent({
  serviceItems,
  activityItems,
  services,
}: {
  serviceItems: CompanyCatalogLabel[];
  activityItems: CompanyCatalogLabel[];
  services: string[];
}) {
  const t = useTranslations('companyPage');
  const hasCatalog = serviceItems.length > 0 || activityItems.length > 0;
  const hasLegacy = services.length > 0;

  if (!hasCatalog && !hasLegacy) {
    return <p className="py-12 text-center text-sm text-ink-muted">{t('noServices')}</p>;
  }

  return (
    <div>
      <CatalogPills
        title={t('servicesTitle')}
        items={serviceItems}
        fallback={hasCatalog ? [] : services}
      />
      <CatalogPills title={t('activitiesTitle')} items={activityItems} fallback={[]} />
    </div>
  );
}

export function CompanyContentTabs({
  company,
  reviews,
  topMentions,
  categoryServices,
  projects,
  serviceItems = [],
  activityItems = [],
  services,
}: CompanyContentTabsProps) {
  const t = useTranslations('companyPage');
  const [activeTab, setActiveTab] = useState<CompanyTab>('reviews');

  const tabs: { id: CompanyTab; label: string }[] = [
    { id: 'reviews', label: t('tabs.reviews') },
    { id: 'projects', label: t('tabs.projects') },
    { id: 'services', label: t('tabs.services') },
  ];

  return (
    <section className="surface-card min-w-0 overflow-hidden shadow-card">
      <div className="bg-brand-500 px-4 py-3 sm:px-6">
        <div className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'shrink-0 border-b-2 pb-2 text-sm font-semibold transition-colors sm:text-base',
                activeTab === tab.id
                  ? 'border-white text-white'
                  : 'border-transparent text-white/55 hover:text-white/80',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-8">
        {activeTab === 'reviews' ? (
          <div className="space-y-8">
            <CompanyReviewsSectionClient company={company} categoryServices={categoryServices} />
            <CompanyReviewsHubLayout
              companyId={company.id}
              reviews={reviews}
              topMentions={topMentions}
              average={company.ratingAverage}
              reviewCount={company.reviewCount}
              distribution={company.ratingDistribution}
            />
          </div>
        ) : null}

        {activeTab === 'projects' ? <ProjectsGrid projects={projects} /> : null}
        {activeTab === 'services' ? (
          <ServicesTabContent
            serviceItems={serviceItems}
            activityItems={activityItems}
            services={services}
          />
        ) : null}
      </div>
    </section>
  );
}
