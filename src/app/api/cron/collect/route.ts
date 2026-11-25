import { NextResponse } from 'next/server';
import { ensureSchema, getDb } from '@/lib/db';
import { collectedCities } from '@/lib/places';

// Saves current US AQI, PM2.5, temperature and weather for ~240 cities into the database.
// Called every 3 hours by .github/workflows/collect.yml (Vercel's free plan only allows
// daily cron jobs). Protected by CRON_SECRET. Uses at most 10 requests per run.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BATCH = 50; // places per request
class RateLimited extends Error {}

const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

async function fetchList(url: string) {
  const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(20_000) });
  if (res.status === 429) throw new RateLimited('Open-Meteo rate limit reached');
  if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);
  const data: unknown = await res.json();
  return (Array.isArray(data) ? data : [data]) as { current?: Record<string, unknown> }[];
}

type Row = { city_id: number; taken_at: string; aqi: number | null; pm25: number | null; temp: number | null; code: number | null };

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const sql = getDb();
  if (!sql) return NextResponse.json({ error: 'DATABASE_URL is not set in Vercel' }, { status: 500 });

  await ensureSchema(sql);
  const cities = collectedCities();
  const takenAt = new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000).toISOString(); // this hour, UTC
  const rows: Row[] = [];
  let failedBatches = 0;

  for (let i = 0; i < cities.length; i += BATCH) {
    const batch = cities.slice(i, i + BATCH);
    const loc = `latitude=${batch.map((c) => c.lat).join(',')}&longitude=${batch.map((c) => c.lon).join(',')}`;
    try {
      const [aq, wx] = await Promise.all([
        fetchList(`https://air-quality-api.open-meteo.com/v1/air-quality?${loc}&current=us_aqi,pm2_5`),
        fetchList(`https://api.open-meteo.com/v1/forecast?${loc}&current=temperature_2m,weather_code`),
      ]);
      batch.forEach((c, k) => {
        const a = aq[k]?.current;
        const w = wx[k]?.current;
        const aqi = n(a?.us_aqi), pm = n(a?.pm2_5), temp = n(w?.temperature_2m), code = n(w?.weather_code);
        if (aqi == null && temp == null) return;
        rows.push({ city_id: c.id, taken_at: takenAt, aqi: aqi == null ? null : Math.round(aqi), pm25: pm, temp, code: code == null ? null : Math.round(code) });
      });
    } catch (err) {
      if (err instanceof RateLimited) { failedBatches += Math.ceil((cities.length - i) / BATCH); break; }
      failedBatches++;
      console.error('Collector batch failed', err);
    }
  }

  if (rows.length > 0) {
    await sql`insert into snapshots (city_id, taken_at, aqi, pm25, temp, code)
      select city_id, taken_at, aqi, pm25, temp, code
      from json_to_recordset(${JSON.stringify(rows)}::json)
        as r(city_id int, taken_at timestamptz, aqi smallint, pm25 real, temp real, code smallint)
      on conflict (city_id, taken_at) do update
        set aqi = excluded.aqi, pm25 = excluded.pm25, temp = excluded.temp, code = excluded.code`;
  }
  await sql`delete from snapshots where taken_at < now() - interval '35 days'`; // keep 35 days

  return NextResponse.json(
    { ok: failedBatches === 0, takenAt, cities: cities.length, saved: rows.length, failedBatches },
    { status: rows.length > 0 ? 200 : 502 },
  );
}
