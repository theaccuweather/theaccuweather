// Rankings: from the collector's database when it's set up (240 cities, with 24-hour and
// 30-day averages), otherwise from one live request for the 40 popular cities.
import { getDb } from './db';
import { collectedCities, getCountry } from './places';
import { POPULAR_CITIES } from './cities';
import { cityHref } from './api/geocoding';
import { getAqiMany } from './api/airQuality';
import { getWeatherMany } from './api/forecast';
import { isBuildPhase, isRateLimit } from './api/client';

export type Period = 'now' | '24h' | '30d';
export type RankRow = {
  id: number; name: string; country: string; href: string;
  aqi: number | null; pm25: number | null; temp: number | null; code: number | null;
};
export type Ranking = { rows: RankRow[]; updated: string | null; days: number; source: 'db' | 'live' };

type DbRow = {
  city_id: number; taken_at: string | Date; aqi: number | null; pm25: number | null;
  temp: number | null; code: number | null; days?: number | null;
};
const toNum = (v: unknown) => (v == null || !Number.isFinite(Number(v)) ? null : Number(v));
const byAqi = (a: RankRow, b: RankRow) => (b.aqi ?? -1) - (a.aqi ?? -1);

export async function rankingFromDb(period: Period): Promise<Ranking | null> {
  const sql = getDb();
  if (!sql) return null;
  let raw: DbRow[];
  try {
    raw = (period === 'now'
      ? await sql`select distinct on (city_id) city_id, taken_at, aqi, pm25, temp, code
          from snapshots
          where taken_at > now() - interval '9 hours' and aqi is not null
          order by city_id, taken_at desc`
      : await sql`select city_id, max(taken_at) as taken_at, round(avg(aqi))::int as aqi,
          round(avg(pm25))::int as pm25, round(avg(temp)::numeric, 1)::float8 as temp, null::int as code,
          count(distinct date_trunc('day', taken_at))::int as days
          from snapshots
          where taken_at > now() - ${period === '24h' ? '24 hours' : '30 days'}::interval and aqi is not null
          group by city_id`) as DbRow[];
  } catch (err) {
    // Before the collector's first run the table doesn't exist yet: that's expected.
    if (!String(err).includes('does not exist')) console.error('Ranking query failed', err);
    return null;
  }

  const info = new Map(collectedCities().map((c) => [c.id, c]));
  let updated = 0;
  let days = 0;
  const rows: RankRow[] = [];
  for (const r of raw) {
    const c = info.get(Number(r.city_id));
    if (!c) continue;
    const t = new Date(r.taken_at).getTime();
    if (t > updated) updated = t;
    const d = toNum(r.days);
    if (d != null && d > days) days = d;
    rows.push({
      id: c.id, name: c.name, country: getCountry(c.cc)?.name ?? c.cc, href: cityHref(c),
      aqi: toNum(r.aqi), pm25: toNum(r.pm25), temp: toNum(r.temp), code: toNum(r.code),
    });
  }
  if (rows.length === 0) return null;
  rows.sort(byAqi);
  return { rows, updated: updated ? new Date(updated).toISOString() : null, days, source: 'db' };
}

/** Live fallback: one batched request for the 40 popular cities. */
export async function liveRanking(): Promise<Ranking | null> {
  const [aq, wx] = await Promise.allSettled([getAqiMany(POPULAR_CITIES), getWeatherMany(POPULAR_CITIES)]);
  // Throwing keeps the last good version of the page live (except during `next build`).
  if (!isBuildPhase()) {
    if (aq.status === 'rejected') throw aq.reason;
    if (wx.status === 'rejected' && isRateLimit(wx.reason)) throw wx.reason;
  }
  if (aq.status === 'rejected') return null;
  const rows: RankRow[] = POPULAR_CITIES.map((c, i) => ({
    id: c.id, name: c.name, country: c.country, href: cityHref(c),
    aqi: aq.value[i]?.aqi ?? null,
    pm25: aq.value[i]?.pm25 ?? null,
    temp: wx.status === 'fulfilled' ? (wx.value[i]?.temp ?? null) : null,
    code: wx.status === 'fulfilled' ? (wx.value[i]?.code ?? null) : null,
  })).filter((r) => r.aqi != null);
  rows.sort(byAqi);
  return { rows, updated: null, days: 0, source: 'live' };
}

/** "Right now": the database when it has fresh data, otherwise live. */
export async function currentRanking(): Promise<Ranking | null> {
  return (await rankingFromDb('now')) ?? liveRanking();
}
