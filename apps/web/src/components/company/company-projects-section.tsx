'use client';

import type { CompanyProject } from '@/lib/company-projects-data';
import { getCompanyProjects } from '@/lib/company-projects-data';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useRef } from 'react';

interface CompanyProjectsSectionProps {
  companyId: string;
}

function ProjectCard({ project }: { project: CompanyProject }) {
  return (
    <article className="flex w-[220px] shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm sm:w-[240px]">
      <div className="relative h-36 overflow-hidden sm:h-40">
        <img src={project.imageUrl} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="flex min-h-[88px] items-center bg-brand-500 px-4 py-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">
          {project.title}
        </h3>
      </div>
    </article>
  );
}

export function CompanyProjectsSection({ companyId }: CompanyProjectsSectionProps) {
  const t = useTranslations('companyPage');
  const scrollRef = useRef<HTMLDivElement>(null);
  const projects = useMemo(() => getCompanyProjects(companyId), [companyId]);

  const scroll = (direction: 'prev' | 'next') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === 'next' ? 260 : -260;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  if (projects.length === 0) return null;

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl bg-[#FBF5F7] p-6 sm:p-8">
      <h2 className="text-lg font-bold text-ink sm:text-2xl">{t('projectsTitle')}</h2>

      <div className="relative mt-6 min-w-0 overflow-hidden">
        <div
          ref={scrollRef}
          className="scrollbar-hide flex w-full max-w-full gap-4 overflow-x-auto overscroll-x-contain pb-2 pe-16"
        >
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 end-0 w-24 bg-gradient-to-l from-[#FBF5F7] to-transparent"
          aria-hidden
        />

        <div className="absolute end-0 top-1/2 flex -translate-y-1/2 gap-2">
          <button
            type="button"
            onClick={() => scroll('prev')}
            aria-label={t('projectsPrev')}
            className={cn(
              'hidden h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-white shadow-md transition-colors hover:bg-brand-600 sm:flex',
            )}
          >
            <ArrowRight className="h-5 w-5 rotate-180 rtl:rotate-0" />
          </button>
          <button
            type="button"
            onClick={() => scroll('next')}
            aria-label={t('projectsNext')}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-white shadow-md transition-colors hover:bg-brand-600"
          >
            <ArrowRight className="h-5 w-5 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </section>
  );
}
