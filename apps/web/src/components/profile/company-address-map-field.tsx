'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DOHA_DEFAULT_LOCATION,
  formatMapCoordinates,
  type CompanyMapLocation,
} from '@/lib/company-location';
import { geocodeAddress, reverseGeocodePlace, type GeocodedPlace } from '@/lib/geocoding';
import { ENGLISH_MAP_TILE_ATTRIBUTION, ENGLISH_MAP_TILE_URL } from '@/lib/map-tiles';
import { cn } from '@/lib/utils';
import { Loader2, MapPin, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface CompanyAddressMapFieldProps {
  address: string;
  city: string;
  country: string;
  location: CompanyMapLocation | null;
  onAddressChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onLocationChange: (value: CompanyMapLocation | null) => void;
  addressError?: string;
  locationError?: string;
  fieldKey?: string;
}

export function CompanyAddressMapField({
  address,
  city,
  country,
  location,
  onAddressChange,
  onCityChange,
  onCountryChange,
  onLocationChange,
  addressError,
  locationError,
  fieldKey = 'companyAddress',
}: CompanyAddressMapFieldProps) {
  const t = useTranslations('profilePage');
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markerRef = useRef<import('leaflet').Marker | null>(null);
  const onLocationChangeRef = useRef(onLocationChange);
  const onAddressChangeRef = useRef(onAddressChange);
  const onCityChangeRef = useRef(onCityChange);
  const onCountryChangeRef = useRef(onCountryChange);
  const initialLocationRef = useRef(location);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
    onAddressChangeRef.current = onAddressChange;
    onCityChangeRef.current = onCityChange;
    onCountryChangeRef.current = onCountryChange;
  }, [onLocationChange, onAddressChange, onCityChange, onCountryChange]);

  const applyPlace = (place: GeocodedPlace) => {
    onAddressChangeRef.current(place.address);
    onCityChangeRef.current(place.city);
    onCountryChangeRef.current(place.country);
    onLocationChangeRef.current({
      latitude: place.latitude,
      longitude: place.longitude,
    });
  };

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const L = await import('leaflet');

      if (cancelled || !mapContainerRef.current || mapRef.current) return;

      const iconRetinaUrl = (await import('leaflet/dist/images/marker-icon-2x.png')).default.src;
      const iconUrl = (await import('leaflet/dist/images/marker-icon.png')).default.src;
      const shadowUrl = (await import('leaflet/dist/images/marker-shadow.png')).default.src;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl,
        iconUrl,
        shadowUrl,
      });

      const initial = initialLocationRef.current ?? DOHA_DEFAULT_LOCATION;
      const map = L.map(mapContainerRef.current, {
        center: [initial.latitude, initial.longitude],
        zoom: initialLocationRef.current ? 15 : 11,
        scrollWheelZoom: true,
      });

      L.tileLayer(ENGLISH_MAP_TILE_URL, {
        attribution: ENGLISH_MAP_TILE_ATTRIBUTION,
        maxZoom: 19,
      }).addTo(map);

      const syncMarker = (latitude: number, longitude: number) => {
        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
          return;
        }

        markerRef.current = L.marker([latitude, longitude], { draggable: true }).addTo(map);
        markerRef.current.on('dragend', () => {
          void handleMapPositionChange();
        });
      };

      if (initialLocationRef.current) {
        syncMarker(initialLocationRef.current.latitude, initialLocationRef.current.longitude);
      }

      map.on('click', (event) => {
        syncMarker(event.latlng.lat, event.latlng.lng);
        void handleMapPositionChange(event.latlng.lat, event.latlng.lng);
      });

      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 0);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  async function handleMapPositionChange(latitude?: number, longitude?: number) {
    const lat = latitude ?? markerRef.current?.getLatLng().lat;
    const lng = longitude ?? markerRef.current?.getLatLng().lng;
    if (lat == null || lng == null) return;

    const map = mapRef.current;
    if (map) {
      map.setView([lat, lng], Math.max(map.getZoom(), 15));
    }

    const place = await reverseGeocodePlace(lat, lng);
    if (place) {
      applyPlace(place);
      return;
    }

    onLocationChangeRef.current({ latitude: lat, longitude: lng });
  }

  useEffect(() => {
    if (!location || !mapRef.current) return;

    const map = mapRef.current;
    map.setView([location.latitude, location.longitude], Math.max(map.getZoom(), 15));

    void import('leaflet').then((L) => {
      if (markerRef.current) {
        markerRef.current.setLatLng([location.latitude, location.longitude]);
        return;
      }

      markerRef.current = L.marker([location.latitude, location.longitude], {
        draggable: true,
      }).addTo(map);
      markerRef.current.on('dragend', () => {
        void handleMapPositionChange();
      });
    });
  }, [location?.latitude, location?.longitude]);

  const handleSearchAddress = async () => {
    const trimmed = address.trim();
    if (!trimmed) {
      toast.error(t('errors.required'));
      return;
    }

    setSearching(true);
    try {
      const result = await geocodeAddress(trimmed, { searchCountry: 'Qatar' });
      if (!result) {
        toast.error(t('companyAddressSearchError'));
        return;
      }

      applyPlace(result);
    } catch {
      toast.error(t('companyAddressSearchError'));
    } finally {
      setSearching(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t('companyLocationUnavailable'));
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void handleMapPositionChange(position.coords.latitude, position.coords.longitude);
        setLocating(false);
      },
      () => {
        setLocating(false);
        toast.error(t('companyLocationUnavailable'));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const displayError = [addressError, locationError].filter(Boolean).join(' ');
  const resolvedPlace = city.trim() && country.trim();

  return (
    <div data-field={fieldKey} className="space-y-3">
      <div>
        <label
          htmlFor={`${fieldKey}-address`}
          className="mb-1.5 block text-sm font-medium text-ink"
        >
          {t('companyAddress')}
          <span className="text-red-600"> *</span>
        </label>
        <p className="mb-3 text-sm text-ink-muted">{t('companyAddressMapHint')}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id={`${fieldKey}-address`}
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleSearchAddress();
              }
            }}
            placeholder={t('companyAddressPlaceholder')}
            className={cn('h-11 flex-1', displayError && 'border-red-300')}
            aria-invalid={Boolean(displayError)}
          />
          <Button
            type="button"
            variant="outline-brand"
            className="h-11 shrink-0 gap-2"
            disabled={searching}
            onClick={() => void handleSearchAddress()}
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Search className="h-4 w-4" aria-hidden />
            )}
            {t('companyAddressSearch')}
          </Button>
        </div>
      </div>

      <div
        ref={mapContainerRef}
        data-field="companyLocation"
        className={cn(
          'h-64 w-full overflow-hidden rounded-xl border bg-slate-100',
          displayError ? 'border-red-300' : 'border-slate-200',
        )}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          disabled={locating}
          onClick={handleUseCurrentLocation}
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-60"
        >
          {locating ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <MapPin className="h-4 w-4" aria-hidden />
          )}
          {t('companyLocationUseMyLocation')}
        </button>
        {location ? (
          <p className="text-xs text-ink-muted">
            {t('companyLocationSelected', { coordinates: formatMapCoordinates(location) })}
          </p>
        ) : (
          <p className="text-xs text-ink-muted">{t('companyAddressMapPending')}</p>
        )}
      </div>

      {resolvedPlace ? (
        <p className="text-sm text-ink-muted">{t('companyAddressResolved', { city, country })}</p>
      ) : null}

      {displayError && <p className="text-sm text-red-600">{displayError}</p>}
    </div>
  );
}
