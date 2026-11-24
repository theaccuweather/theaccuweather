import { NextResponse } from 'next/server';
import { getAirQuality } from '@/lib/api/airQuality';
import { getForecast } from '@/lib/api/forecast';
import { buildHero } from '@/lib/hero';

// GET /api/summary?lat=..&lon=..&name=..&region=.. -> data for the home page's AQI card.
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const lat = Math.round(Number(sp.get('lat')) * 100) / 100; // ~1 km, so caching works
  const lon = Math.round(Number(sp.get('lon')) * 100) / 100;
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: 'Invalid location' }, { status: 400 });
  }
  const name = (sp.get('name') ?? '').trim().slice(0, 60) || 'Your location';
  const region = (sp.get('region') ?? '').trim().slice(0, 80);

  const [aq, fc] = await Promise.allSettled([getAirQuality(lat, lon), getForecast(lat, lon)]);
  if (aq.status === 'rejected' && fc.status === 'rejected') {
    return NextResponse.json({ error: 'Live data is unavailable right now' }, { status: 502 });
  }
  const partial = aq.status === 'rejected' || fc.status === 'rejected';
  const hero = buildHero(
    name, region, lat, lon,
    fc.status === 'fulfilled' ? fc.value : null,
    aq.status === 'fulfilled' ? aq.value : null,
  );
  // Don't let the CDN keep a half-empty answer; full answers are reused for an hour.
  return NextResponse.json(hero, {
    headers: { 'Cache-Control': partial ? 'no-store' : 'public, s-maxage=3600, stale-while-revalidate=7200' },
  });
}
