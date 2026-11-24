import { ApiError, getJson } from './client';

export type Place = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string; // state / province
  timezone?: string;
  population?: number;
};

/** Open-Meteo geocoding search, e.g. "Delhi" -> list of matching places. Cached for a day. */
export async function searchPlaces(query: string): Promise<Place[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`;
  const data = await getJson<{ results?: Place[] }>(url, 86_400);
  return data.results ?? [];
}

/** Look a place up by its GeoNames id (the number in our city URLs). Cached for a week. */
export async function getPlace(id: number): Promise<Place | null> {
  try {
    const p = await getJson<Partial<Place>>(`https://geocoding-api.open-meteo.com/v1/get?id=${id}`, 604_800);
    if (!p || typeof p.name !== 'string' || typeof p.latitude !== 'number') return null;
    return p as Place;
  } catch (err) {
    if (err instanceof ApiError && err.status && err.status < 500) return null; // unknown id
    throw err;
  }
}

/** "São Paulo" -> "sao-paulo" for readable URLs. */
export function slugify(s: string): string {
  return (
    s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'city'
  );
}

/** Canonical URL of a city page: /city/1261481/new-delhi */
export const cityHref = (p: { id: number; name: string }) => `/city/${p.id}/${slugify(p.name)}`;
