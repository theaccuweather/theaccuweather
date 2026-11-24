import { NextResponse } from 'next/server';
import { getAirQuality } from '@/lib/api/airQuality';
import { getForecast } from '@/lib/api/forecast';
import { categorize } from '@/lib/aqi';
import { describeWeather } from '@/lib/weatherCodes';

// GET /api/summary?lat=..&lon=.. -> small AQI + weather summary for the home page card.
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const lat = Math.round(Number(sp.get('lat')) * 100) / 100; // ~1 km, so caching works
  const lon = Math.round(Number(sp.get('lon')) * 100) / 100;
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: 'Invalid location' }, { status: 400 });
  }
  const [aq, fc] = await Promise.allSettled([getAirQuality(lat, lon), getForecast(lat, lon)]);
  if (aq.status === 'rejected' && fc.status === 'rejected') {
    return NextResponse.json({ error: 'Live data is unavailable right now' }, { status: 502 });
  }
  const air = aq.status === 'fulfilled' ? aq.value : null;
  const wx = fc.status === 'fulfilled' ? fc.value.current : null;
  const cat = categorize('us', air?.us.aqi ?? null);
  const pm = (k: string) => air?.pollutants.find((p) => p.key === k)?.value ?? null;
  return NextResponse.json(
    {
      lat, lon,
      aqi: air?.us.aqi ?? null,
      label: cat?.label ?? null,
      color: cat?.color ?? null,
      pm25: pm('pm2_5'),
      pm10: pm('pm10'),
      temp: wx?.temperature ?? null,
      humidity: wx?.humidity ?? null,
      wind: wx?.wind ?? null,
      weather: wx ? describeWeather(wx.code, wx.isDay) : null,
    },
    { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' } },
  );
}
