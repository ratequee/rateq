import type { CompanyPublic } from '@rateq/types';

/** Reference point for "you are here" distance (Doha center). */
export const NEARBY_USER_LOCATION = {
  latitude: 25.2783,
  longitude: 51.5466,
};

/** Map overlay bounds matching the embedded Doha map view. */
export const DOHA_MAP_BOUNDS = {
  north: 25.305,
  south: 25.255,
  east: 51.575,
  west: 51.515,
};

/** Demo coordinates around Doha — replace with API fields later. */
const NEARBY_COORDINATES: Array<{ latitude: number; longitude: number }> = [
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

export function latLngToOverlayPercent(
  latitude: number,
  longitude: number,
): { x: number; y: number } {
  const x =
    ((longitude - DOHA_MAP_BOUNDS.west) / (DOHA_MAP_BOUNDS.east - DOHA_MAP_BOUNDS.west)) * 100;
  const y =
    ((DOHA_MAP_BOUNDS.north - latitude) / (DOHA_MAP_BOUNDS.north - DOHA_MAP_BOUNDS.south)) * 100;

  return {
    x: Math.min(100, Math.max(0, x)),
    y: Math.min(100, Math.max(0, y)),
  };
}

export function enrichCompaniesWithNearbyLocations(companies: CompanyPublic[]): NearbyCompany[] {
  return companies.map((company, index) => {
    const coordinate = NEARBY_COORDINATES[index % NEARBY_COORDINATES.length];
    const distanceMeters = haversineDistanceMeters(
      NEARBY_USER_LOCATION.latitude,
      NEARBY_USER_LOCATION.longitude,
      coordinate.latitude,
      coordinate.longitude,
    );

    return {
      ...company,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      distanceMeters,
    };
  });
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
