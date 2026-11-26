// Points for the world AQI map: the collector's latest readings (240 cities) when the
// database is set up, otherwise one live request for the 40 popular cities.
import { currentRanking } from './rankings';
import { getCityById } from './places';
import { POPULAR_CITIES } from './cities';

export type MapPoint = {
  id: number; name: string; country: string; href: string; lat: number; lon: number;
  aqi: number | null; pm25: number | null; temp: number | null; code: number | null;
};

export async function mapPoints(): Promise<{ points: MapPoint[]; source: 'db' | 'live' } | null> {
  const r = await currentRanking();
  if (!r) return null;
  const points: MapPoint[] = [];
  for (const row of r.rows) {
    const c = getCityById(row.id) ?? POPULAR_CITIES.find((p) => p.id === row.id);
    if (!c) continue;
    points.push({ ...row, lat: c.lat, lon: c.lon });
  }
  return { points, source: r.source };
}
