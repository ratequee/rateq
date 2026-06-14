export const DOHA_DEFAULT_LOCATION = {
  latitude: 25.2854,
  longitude: 51.531,
} as const;

export interface CompanyMapLocation {
  latitude: number;
  longitude: number;
}

export function formatMapCoordinates(location: CompanyMapLocation): string {
  return `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
}

export function isValidMapLocation(
  location: CompanyMapLocation | null | undefined,
): location is CompanyMapLocation {
  if (!location) return false;
  const { latitude, longitude } = location;
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}
