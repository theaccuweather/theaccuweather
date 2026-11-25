import { getJson, hourIndex, localNow, num } from './client';
import { isDaytime, sunTimes, type SunDay } from '@/lib/sun';

export type Forecast = {
  current: {
    time: string; // local time at the location, e.g. "2026-11-25T00:15"
    temperature: number | null;
    feelsLike: number | null;
    humidity: number | null;
    wind: number | null; // km/h
    uv: number | null;
    visibilityKm: number | null; // API gives metres; we convert
    pressure: number | null; // hPa
    code: number | null; // WMO weather code
    isDay: boolean;
  };
  hourly: { time: string; temp: number | null; pop: number | null; code: number | null; isDay: boolean }[];
  daily: {
    date: string;
    max: number | null;
    min: number | null;
    code: number | null;
    precip: number | null;
    sunrise: string;
    sunset: string;
  }[];
};

type Raw = {
  utc_offset_seconds?: number;
  hourly: Record<string, unknown[]> & { time: string[] };
};

// Exactly 10 hourly variables for 7 days = 1 call on Open-Meteo's counting (more than 10
// variables counts as extra calls). Current conditions, daily highs and lows, rain totals,
// the day's sky and day/night are all derived from these hourly values.
const HOURLY = [
  'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'wind_speed_10m', 'uv_index',
  'visibility', 'pressure_msl', 'weather_code', 'precipitation_probability', 'precipitation',
] as const;

/** Current conditions, the next 24 hours and 7 days for one location (metric units). */
export async function getForecast(lat: number, lon: number, revalidate?: number): Promise<Forecast> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: HOURLY.join(','),
    timezone: 'auto', // all times come back in the location's own local time
    forecast_days: '7',
    wind_speed_unit: 'kmh',
  });
  const raw = await getJson<Raw>(`https://api.open-meteo.com/v1/forecast?${params}`, revalidate);
  const h = raw.hourly;
  const times: string[] = h?.time ?? [];
  const col = (k: (typeof HOURLY)[number]) => (h?.[k] ?? []).map(num);
  const temp = col('temperature_2m'), rh = col('relative_humidity_2m'), feels = col('apparent_temperature');
  const wind = col('wind_speed_10m'), uv = col('uv_index'), vis = col('visibility'), pres = col('pressure_msl');
  const code = col('weather_code'), pop = col('precipitation_probability'), rain = col('precipitation');

  const offset = typeof raw.utc_offset_seconds === 'number' ? raw.utc_offset_seconds : 0;
  const now = localNow(offset);
  const i0 = hourIndex(times, now);

  // Group the hours by local date for the daily table, and work out each day's sun times.
  const order: string[] = [];
  const byDay = new Map<string, number[]>();
  times.forEach((t, i) => {
    const d = t.slice(0, 10);
    if (!byDay.has(d)) { byDay.set(d, []); order.push(d); }
    byDay.get(d)!.push(i);
  });
  const sun = new Map<string, SunDay>(order.map((d) => [d, sunTimes(d, lat, lon, offset)]));
  const isDayAt = (t: string) => isDaytime(t, sun.get(t.slice(0, 10)));
  const pick = (arr: (number | null)[], idx: number[]) => idx.map((i) => arr[i]).filter((v): v is number => v != null);

  const daily = order.map((date) => {
    const idx = byDay.get(date)!;
    const t = pick(temp, idx), c = pick(code, idx), p = pick(rain, idx);
    const s = sun.get(date)!;
    return {
      date,
      max: t.length ? Math.max(...t) : null,
      min: t.length ? Math.min(...t) : null,
      code: c.length ? Math.max(...c) : null, // the day's most severe weather, like Open-Meteo's daily code
      precip: p.length ? Math.round(p.reduce((a, b) => a + b, 0) * 10) / 10 : null,
      sunrise: s.sunrise,
      sunset: s.sunset,
    };
  });

  const hourly = times.slice(i0, i0 + 24).map((time, k) => {
    const i = i0 + k;
    return { time, temp: temp[i] ?? null, pop: pop[i] ?? null, code: code[i] ?? null, isDay: isDayAt(time) };
  });

  const v = vis[i0] ?? null;
  return {
    current: {
      time: now,
      temperature: temp[i0] ?? null,
      feelsLike: feels[i0] ?? null,
      humidity: rh[i0] ?? null,
      wind: wind[i0] ?? null,
      uv: uv[i0] ?? null,
      visibilityKm: v == null ? null : Math.round(v / 100) / 10, // API gives metres
      pressure: pres[i0] ?? null,
      code: code[i0] ?? null,
      isDay: isDayAt(now),
    },
    hourly,
    daily,
  };
}

/** Temperature and sky for many places in ONE request (used by home and ranking pages). */
export async function getWeatherMany(points: { lat: number; lon: number }[], revalidate = 10_800) {
  const params = new URLSearchParams({
    latitude: points.map((p) => p.lat).join(','),
    longitude: points.map((p) => p.lon).join(','),
    current: 'temperature_2m,weather_code,is_day',
    timezone: 'auto',
  });
  // Refreshed every 3 hours: only the ranking's temperature column uses this.
  const raw = await getJson<unknown>(`https://api.open-meteo.com/v1/forecast?${params}`, revalidate);
  const list = (Array.isArray(raw) ? raw : [raw]) as { current?: Record<string, unknown> }[];
  return list.map((r) => ({
    temp: num(r.current?.temperature_2m),
    code: num(r.current?.weather_code),
    isDay: r.current?.is_day !== 0,
  }));
}
