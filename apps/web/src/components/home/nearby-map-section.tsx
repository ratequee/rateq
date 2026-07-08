'use client';

import { darkBorder, darkCardElevated } from '@/lib/dark-surfaces';
import { cn } from '@/lib/utils';

import { NearbyCompaniesMap } from '@/components/home/nearby-companies-map';
import { NearbyCompanyListCard } from '@/components/home/nearby-company-list-card';
import { Link } from '@/i18n/routing';
import { QATAR_CENTER, useUserLocation } from '@/lib/hooks/use-user-location';
import { enrichCompaniesWithNearbyLocations } from '@/lib/nearby-locations';
import type { CompanyPublic } from '@rateq/types';
import { ArrowRight, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

type NearbyView = 'map' | 'list';

interface NearbyMapSectionProps {
  companies: CompanyPublic[];
}

export function NearbyMapSection({ companies }: NearbyMapSectionProps) {
  const t = useTranslations('home');
  const userLocation = useUserLocation();
  const [view, setView] = useState<NearbyView>('map');
  const [query, setQuery] = useState('');

  const useQatarFallback = userLocation.status !== 'granted';

  const origin = useMemo(() => {
    if (userLocation.status === 'granted') {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      };
    }
    return QATAR_CENTER;
  }, [userLocation]);

  const mapCenter = origin;
  const mapZoom = userLocation.status === 'granted' ? 12 : 8;

  const nearbyCompanies = useMemo(
    () =>
      enrichCompaniesWithNearbyLocations(companies, origin, {
        qatarOnly: useQatarFallback,
      }),
    [companies, origin, useQatarFallback],
  );

  const filteredCompanies = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return nearbyCompanies;

    return nearbyCompanies.filter((company) => {
      const name = company.name.toLowerCase();
      const categoryEn = company.categoryName?.toLowerCase() ?? '';
      const categoryAr = company.categoryNameAr?.toLowerCase() ?? '';
      const city = company.city.toLowerCase();
      return (
        name.includes(normalized) ||
        categoryEn.includes(normalized) ||
        categoryAr.includes(normalized) ||
        city.includes(normalized)
      );
    });
  }, [nearbyCompanies, query]);

  const locationHint =
    userLocation.status === 'pending'
      ? t('nearbyLocating')
      : userLocation.status === 'denied'
        ? t('nearbyQatarFallback')
        : t('nearbyUsingYourLocation');

  return (
    <section className="bg-white py-12 dark:bg-dm-bg sm:py-16 lg:py-20">
      <div
        className={cn(
          'relative z-10 mx-auto mt-[-200px] max-w-page rounded-3xl border border-slate-100 bg-white p-6 shadow-lg sm:p-8 lg:p-10',
          darkCardElevated,
        )}
      >
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-lg font-bold text-ink dark:text-white sm:text-3xl">
            {t('nearbyTitle')}
          </h2>
          <Link
            href="/search"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-500 transition-colors hover:text-brand-600 dark:text-white dark:hover:text-white/85"
          >
            {t('nearbyViewAll')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
        <p className="mb-6 text-sm text-ink-muted dark:text-white/90">{locationHint}</p>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex shrink-0 rounded-full bg-brand-100 p-1">
            <button
              type="button"
              onClick={() => setView('list')}
              className={cn(
                'rounded-full px-5 py-2 text-sm font-semibold transition-colors',
                view === 'list'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-brand-500 hover:text-brand-600',
              )}
            >
              {t('nearbyViewList')}
            </button>
            <button
              type="button"
              onClick={() => setView('map')}
              className={cn(
                'rounded-full px-5 py-2 text-sm font-semibold transition-colors',
                view === 'map'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-brand-500 hover:text-brand-600',
              )}
            >
              {t('nearbyViewMap')}
            </button>
          </div>

          <div className="relative min-w-0 max-w-[500px] flex-1">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('nearbySearchPlaceholder')}
              className="h-11 w-full rounded-full border-0 bg-brand-500 pe-12 ps-5 text-sm text-white placeholder:text-white/80 focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
            <span className="pointer-events-none absolute end-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white">
              <Search className="h-4 w-4" />
            </span>
          </div>
        </div>

        <div className={cn(view !== 'map' && 'hidden')}>
          <NearbyCompaniesMap
            companies={filteredCompanies}
            mapCenter={mapCenter}
            mapZoom={mapZoom}
            userLocation={userLocation.status === 'granted' ? origin : null}
            isActive={view === 'map'}
          />
        </div>

        <div className={cn(view !== 'list' && 'hidden', 'max-h-[400px] overflow-y-auto pe-1')}>
          {filteredCompanies.length === 0 ? (
            <p
              className={cn(
                'rounded-2xl border border-dashed border-slate-200 py-16 text-center text-sm text-ink-muted dark:text-white/85',
                darkBorder,
              )}
            >
              {t('nearbyNoResults')}
            </p>
          ) : (
            <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCompanies.map((company) => (
                <li key={company.id}>
                  <NearbyCompanyListCard company={company} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
