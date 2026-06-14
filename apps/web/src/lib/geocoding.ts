import type { CompanyMapLocation } from '@/lib/company-location';

export interface GeocodedPlace extends CompanyMapLocation {
  address: string;
  city: string;
  country: string;
}

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  state_district?: string;
  suburb?: string;
  country?: string;
}

interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
}

interface NominatimReverseResult {
  display_name?: string;
  address?: NominatimAddress;
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'RateQ/1.0 (https://www.rateq.qa)';

function parseCity(address?: NominatimAddress): string {
  if (!address) return '';

  return (
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.suburb ??
    address.state_district ??
    address.county ??
    address.state ??
    ''
  ).trim();
}

function parseCountry(address?: NominatimAddress): string {
  return address?.country?.trim() ?? '';
}

function toGeocodedPlace(result: {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
}): GeocodedPlace | null {
  const latitude = Number(result.lat);
  const longitude = Number(result.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const city = parseCity(result.address);
  const country = parseCountry(result.address);

  return {
    latitude,
    longitude,
    address: result.display_name.trim(),
    city,
    country,
  };
}

async function nominatimFetch<T>(path: string): Promise<T | null> {
  const response = await fetch(`${NOMINATIM_BASE}${path}`, {
    headers: { 'Accept-Language': 'en', 'User-Agent': USER_AGENT },
  });

  if (!response.ok) return null;
  return (await response.json()) as T;
}

export async function geocodeAddress(
  query: string,
  options?: { searchCountry?: string },
): Promise<GeocodedPlace | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const searchCountry = options?.searchCountry?.trim();
  const searchQuery =
    searchCountry && !trimmed.toLowerCase().includes(searchCountry.toLowerCase())
      ? `${trimmed}, ${searchCountry}`
      : trimmed;

  const params = new URLSearchParams({
    q: searchQuery,
    format: 'json',
    limit: '1',
    addressdetails: '1',
  });

  if (searchCountry?.toLowerCase() === 'qatar') {
    params.set('countrycodes', 'qa');
  }

  const results = await nominatimFetch<NominatimSearchResult[]>(`/search?${params.toString()}`);

  const match = results?.[0];
  if (!match) return null;

  return toGeocodedPlace(match);
}

export async function reverseGeocodePlace(
  latitude: number,
  longitude: number,
): Promise<GeocodedPlace | null> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: 'json',
    addressdetails: '1',
  });

  const result = await nominatimFetch<NominatimReverseResult>(`/reverse?${params.toString()}`);
  if (!result?.display_name) return null;

  return toGeocodedPlace({
    lat: String(latitude),
    lon: String(longitude),
    display_name: result.display_name,
    address: result.address,
  });
}
