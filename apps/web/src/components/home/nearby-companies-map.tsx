'use client';

import type { NearbyCompany } from '@/lib/nearby-locations';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { ArrowRight, Star, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

interface MapCenter {
  latitude: number;
  longitude: number;
}

interface NearbyCompaniesMapProps {
  companies: NearbyCompany[];
  mapCenter: MapCenter;
  mapZoom: number;
  userLocation?: MapCenter | null;
}

export function NearbyCompaniesMap({
  companies,
  mapCenter,
  mapZoom,
  userLocation,
}: NearbyCompaniesMapProps) {
  const t = useTranslations('home');
  const locale = useLocale();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markersLayerRef = useRef<import('leaflet').LayerGroup | null>(null);
  const userMarkerRef = useRef<import('leaflet').CircleMarker | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(companies[0]?.id ?? null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);

  const selected = companies.find((company) => company.id === selectedId) ?? null;

  useEffect(() => {
    if (companies.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !companies.some((company) => company.id === selectedId)) {
      setSelectedId(companies[0]?.id ?? null);
    }
  }, [companies, selectedId]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const L = await import('leaflet');
      if (cancelled || !mapContainerRef.current) return;

      if (!mapRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [mapCenter.latitude, mapCenter.longitude],
          zoom: mapZoom,
          scrollWheelZoom: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>`,
          maxZoom: 19,
        }).addTo(map);

        markersLayerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
        setTimeout(() => map.invalidateSize(), 0);
      } else {
        mapRef.current.setView([mapCenter.latitude, mapCenter.longitude], mapZoom);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mapCenter.latitude, mapCenter.longitude, mapZoom]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      userMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selected) {
      setPopupPosition(null);
      return;
    }

    const updatePopupPosition = () => {
      const point = map.latLngToContainerPoint([selected.latitude, selected.longitude]);
      setPopupPosition({ x: point.x, y: point.y });
    };

    updatePopupPosition();
    map.on('move zoom resize', updatePopupPosition);
    return () => {
      map.off('move zoom resize', updatePopupPosition);
    };
  }, [selected]);

  useEffect(() => {
    void (async () => {
      const L = await import('leaflet');
      const map = mapRef.current;
      const layer = markersLayerRef.current;
      if (!map || !layer) return;

      layer.clearLayers();

      for (const company of companies) {
        const isSelected = company.id === selectedId;
        const html = company.logo
          ? `<img src="${company.logo}" alt="" style="width:40px;height:40px;border-radius:9999px;object-fit:cover;border:3px solid ${isSelected ? '#1d4ed8' : '#ffffff'};box-shadow:0 4px 10px rgba(15,23,42,0.25);" />`
          : `<div style="width:40px;height:40px;border-radius:9999px;background:#2563eb;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;border:3px solid ${isSelected ? '#1d4ed8' : '#ffffff'};box-shadow:0 4px 10px rgba(15,23,42,0.25);">${company.name.charAt(0)}</div>`;

        const marker = L.marker([company.latitude, company.longitude], {
          icon: L.divIcon({
            className: 'nearby-map-marker',
            html,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
          }),
        });

        marker.on('click', () => setSelectedId(company.id));
        marker.bindTooltip(company.name, {
          direction: 'top',
          opacity: 0.95,
          className: locale === 'ar' ? 'nearby-map-tooltip rtl' : 'nearby-map-tooltip',
        });
        marker.addTo(layer);
      }

      if (userLocation) {
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([userLocation.latitude, userLocation.longitude]);
        } else {
          userMarkerRef.current = L.circleMarker([userLocation.latitude, userLocation.longitude], {
            radius: 7,
            color: '#ffffff',
            weight: 2,
            fillColor: '#22c55e',
            fillOpacity: 1,
          }).addTo(map);
          userMarkerRef.current.bindTooltip(t('nearbyYourLocation'), { direction: 'top' });
        }
      } else if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    })();
  }, [companies, locale, selectedId, t, userLocation]);

  return (
    <div className="relative h-[400px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-card">
      <div
        ref={mapContainerRef}
        className="relative z-0 h-full w-full [&_.leaflet-control-attribution]:text-[10px]"
        role="img"
        aria-label={t('nearbyMapAlt')}
      />

      {selected && popupPosition ? (
        <article
          style={{ left: popupPosition.x, top: popupPosition.y }}
          className="pointer-events-auto absolute z-[700] w-[min(280px,calc(100%-2rem))] -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-3xl border border-slate-200 bg-white p-4 shadow-xl"
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
                className="mt-[-8px] h-20 w-20 shrink-0 rounded-3xl object-cover"
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
                ({selected.reviewCount.toLocaleString(locale)})
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
      ) : null}
    </div>
  );
}
