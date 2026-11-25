import { NextResponse } from 'next/server';
import { getJson, isRateLimit, num } from '@/lib/api/client';

// GET /api/history?lat=..&lon=.. -> the last 30 days: daily high/low temperature, rain, and the
// daily average and peak US AQI. Loaded only when a visitor opens "Last 30 days" (search engines
// never trigger it), rounded to ~10 km and cached for a day to protect the free API budget.
type AqRaw = { hourly?: { time?: string[]; us_aqi?: unknown[] } };
type WxRaw = { daily?: { time?: string[]; temperature_2m_max?: unknown[]; temperature_2m_min?: unknown[]; precipitation_sum?: unknown[] } };
type Day = { date: string; max: number | null; min: number | null; rain: number | null; aqiAvg: number | null; aqiMax: number | null };

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const lat = Math.round(Number(sp.get('lat')) * 10) / 10;
  const lon = Math.round(Number(sp.get('lon')) * 10) / 10;
  if (!sp.get('lat') || !sp.get('lon') || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: 'Invalid location' }, { status: 400 });
  }
  const base = `latitude=${lat}&longitude=${lon}&past_days=31&forecast_days=1&timezone=auto`;
  const [aq, wx] = await Promise.allSettled([
    getJson<AqRaw>(`https://air-quality-api.open-meteo.com/v1/air-quality?${base}&hourly=us_aqi`, 86_400),
    getJson<WxRaw>(`https://api.open-meteo.com/v1/forecast?${base}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum`, 86_400),
  ]);
  if (aq.status === 'rejected' && wx.status === 'rejected') {
    const busy = isRateLimit(aq.reason) || isRateLimit(wx.reason);
    return NextResponse.json(
      { error: busy ? 'The data provider is busy right now. Please try again later.' : 'History is unavailable right now.' },
      { status: busy ? 503 : 502 },
    );
  }

  const days = new Map<string, Day>();
  const day = (date: string): Day => {
    let d = days.get(date);
    if (!d) { d = { date, max: null, min: null, rain: null, aqiAvg: null, aqiMax: null }; days.set(date, d); }
    return d;
  };
  let today = '';

  if (wx.status === 'fulfilled') {
    const d = wx.value.daily;
    const times = d?.time ?? [];
    times.forEach((date, i) => {
      const x = day(date);
      x.max = num(d?.temperature_2m_max?.[i]);
      x.min = num(d?.temperature_2m_min?.[i]);
      x.rain = num(d?.precipitation_sum?.[i]);
    });
    today = times[times.length - 1] ?? '';
  }
  if (aq.status === 'fulfilled') {
    const h = aq.value.hourly;
    const times = h?.time ?? [];
    const vals = (h?.us_aqi ?? []).map(num);
    const byDate = new Map<string, number[]>();
    times.forEach((t, i) => {
      const v = vals[i];
      if (v == null) return;
      const d = t.slice(0, 10);
      const list = byDate.get(d);
      if (list) list.push(v);
      else byDate.set(d, [v]);
    });
    if (!today && times.length) today = times[times.length - 1].slice(0, 10);
    byDate.forEach((v, d) => {
      if (v.length < 18) return; // skip days with too few hours
      const x = day(d);
      x.aqiAvg = Math.round(v.reduce((a, b) => a + b, 0) / v.length);
      x.aqiMax = Math.round(Math.max(...v));
    });
  }

  // The last 30 full days, oldest first (today is still in progress).
  const list = [...days.values()].filter((d) => d.date < today).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  const partial = aq.status === 'rejected' || wx.status === 'rejected';
  return NextResponse.json(
    { days: list, partial },
    { headers: { 'Cache-Control': partial ? 'no-store' : 'public, s-maxage=43200, stale-while-revalidate=86400' } },
  );
}
