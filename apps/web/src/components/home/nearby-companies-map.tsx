'use client';

import type { NearbyCompany } from '@/lib/nearby-locations';
import { latLngToOverlayPercent } from '@/lib/nearby-locations';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { ArrowRight, Star, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

interface NearbyCompaniesMapProps {
  companies: NearbyCompany[];
}

export function NearbyCompaniesMap({ companies }: NearbyCompaniesMapProps) {
  const t = useTranslations('home');
  const [selectedId, setSelectedId] = useState<string | null>(companies[0]?.id ?? null);

  const selected = useMemo(
    () => companies.find((company) => company.id === selectedId) ?? null,
    [companies, selectedId],
  );

  const selectedPosition = selected
    ? latLngToOverlayPercent(selected.latitude, selected.longitude)
    : null;

  return (
    <div className="relative h-[400px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-card">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d14431.08826928405!2d51.546554699999994!3d25.278251899999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sqa!4v1780184175861!5m2!1sen!2sqa"
        width="100%"
        height="100%"
        className="absolute inset-0 h-full w-full border-0"
        allowFullScreen
        loading="lazy"
        referrerPolicy="origin"
        title={t('nearbyMapAlt')}
      />

      <div className="pointer-events-none absolute inset-0">
        {companies.map((company) => {
          const { x, y } = latLngToOverlayPercent(company.latitude, company.longitude);
          const isSelected = company.id === selectedId;

          return (
            <button
              key={company.id}
              type="button"
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={() => setSelectedId(company.id)}
              className={cn(
                'pointer-events-auto absolute z-10 -translate-x-1/2 -translate-y-full transition-transform hover:scale-110',
                isSelected && 'z-20 scale-110',
              )}
              aria-label={company.name}
            >
              {company.logo ? (
                <img
                  src={company.logo}
                  alt=""
                  className={cn(
                    'h-10 w-10 rounded-full border-2 bg-white object-cover shadow-md',
                    isSelected ? 'border-brand-500 ring-2 ring-brand-200' : 'border-white',
                  )}
                />
              ) : (
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 bg-brand-500 text-xs font-bold text-white shadow-md',
                    isSelected ? 'border-brand-700 ring-2 ring-brand-200' : 'border-white',
                  )}
                >
                  {company.name.charAt(0)}
                </span>
              )}
            </button>
          );
        })}

        {selected && selectedPosition && (
          <article
            style={{ left: `${selectedPosition.x}%`, top: `${selectedPosition.y}%` }}
            className="pointer-events-auto absolute z-30 w-[min(280px,calc(100%-2rem))] -translate-x-1/2 translate-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl"
          >
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="absolute end-2 top-2 rounded-full p-1 text-ink-muted hover:bg-slate-100"
              aria-label={t('nearbyClosePopup')}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3 pe-6">
              {selected.logo ? (
                <img
                  src={selected.logo}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-3xl object-cover mt-[-30px]"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-brand-100 text-sm font-bold text-brand-600">
                  {selected.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-ink">{selected.name}</h3>
                <p className="text-xs text-ink-muted">
                  {selected.city} - {selected.country}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-ink">
                  {selected.ratingAverage.toFixed(1)}
                </span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={cn(
                        'h-3.5 w-3.5',
                        index < Math.round(selected.ratingAverage)
                          ? 'fill-gold-400 text-gold-400'
                          : 'text-slate-300',
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-ink-muted">
                  ({selected.reviewCount.toLocaleString()})
                </span>
              </div>

              <Link
                href={`/companies/${selected.slug}`}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-400 text-white transition-colors hover:bg-gold-500"
                aria-label={t('viewCompany', { name: selected.name })}
              >
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
