// Current weather and US AQI for several places at once (one batched request each).
// Used by country pages, which refresh every 6 hours to protect the free API budget.
import { getAqiMany } from './api/airQuality';
import { getWeatherMany } from './api/forecast';
import { isRateLimit } from './api/client';

export type Live = { temp: number | null; code: number | null; isDay: boolean; aqi: number | null };

/** Returns one reading per place, or null if both requests failed. */
export async function liveReadings(points: { lat: number; lon: number }[], revalidate: number): Promise<Live[] | null> {
  if (points.length === 0) return [];
  const [wx, aq] = await Promise.allSettled([getWeatherMany(points, revalidate), getAqiMany(points, revalidate)]);
  // Rate limited: throw, so Next.js keeps showing the last good version of the page.
  for (const r of [wx, aq]) if (r.status === 'rejected' && isRateLimit(r.reason)) throw r.reason;
  if (wx.status === 'rejected' && aq.status === 'rejected') return null;
  return points.map((_, i) => {
    const w = wx.status === 'fulfilled' ? wx.value[i] : undefined;
    const a = aq.status === 'fulfilled' ? aq.value[i] : undefined;
    return { temp: w?.temp ?? null, code: w?.code ?? null, isDay: w?.isDay ?? true, aqi: a?.aqi ?? null };
  });
}
