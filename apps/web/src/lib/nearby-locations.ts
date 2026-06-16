import type { CompanyPublic } from '@rateq/types';
import { QATAR_CENTER } from '@/lib/hooks/use-user-location';

export { QATAR_CENTER };

/** Demo coordinates around Qatar — used when a company has no lat/lng yet. */
const FALLBACK_COORDINATES: Array<{ latitude: number; longitude: number }> = [
  { latitude: 25.2924, longitude: 51.5312 },
  { latitude: 25.2816, longitude: 51.5528 },
  { latitude: 25.2718, longitude: 51.5384 },
  { latitude: 25.2862, longitude: 51.5641 },
  { latitude: 25.2645, longitude: 51.5513 },
  { latitude: 25.2988, longitude: 51.5489 },
  { latitude: 25.2764, longitude: 51.5237 },
  { latitude: 25.2891, longitude: 51.5576 },
  { latitude: 25.2689, longitude: 51.5421 },
  { latitude: 25.2837, longitude: 51.5694 },
  { latitude: 25.2598, longitude: 51.5348 },
  { latitude: 25.3012, longitude: 51.5365 },
];

export interface NearbyCompany extends CompanyPublic {
  latitude: number;
  longitude: number;
  distanceMeters: number;
}

function isQatarCompany(company: CompanyPublic): boolean {
  const country = company.country.trim().toLowerCase();
  return country === 'qatar' || country === 'qa' || country.includes('قطر');
}

export function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function enrichCompaniesWithNearbyLocations(
  companies: CompanyPublic[],
  origin: { latitude: number; longitude: number } = QATAR_CENTER,
  options?: { qatarOnly?: boolean },
): NearbyCompany[] {
  const filtered = options?.qatarOnly ? companies.filter(isQatarCompany) : companies;

  return filtered
    .map((company, index) => {
      const coordinate =
        company.latitude != null && company.longitude != null
          ? { latitude: company.latitude, longitude: company.longitude }
          : (FALLBACK_COORDINATES[index % FALLBACK_COORDINATES.length] ?? FALLBACK_COORDINATES[0]!);

      const distanceMeters = haversineDistanceMeters(
        origin.latitude,
        origin.longitude,
        coordinate.latitude,
        coordinate.longitude,
      );

      return {
        ...company,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        distanceMeters,
      };
    })
    .sort((left, right) => left.distanceMeters - right.distanceMeters);
}

export function formatDistanceMeters(
  distanceMeters: number,
  formatMeters: (distance: number) => string,
  formatKm: (distance: string) => string,
): string {
  if (distanceMeters < 1000) {
    return formatMeters(distanceMeters);
  }
  return formatKm((distanceMeters / 1000).toFixed(1));
}
