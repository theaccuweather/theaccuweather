import { getJson, hourIndex, localNow, num } from './client';
import {
  computeEuSubIndices, computeIndiaAqi, computeUsSubIndices, mainPollutant, POLLUTANTS, POLLUTANT_LABEL,
  type PollutantKey,
} from '@/lib/aqi';

export type ScaleReading = { aqi: number | null; dominant: PollutantKey | null };
export type AirQuality = {
  time: string;
  us: ScaleReading;
  eu: ScaleReading;
  in: ScaleReading;
  pollutants: { key: PollutantKey; label: string; value: number | null; unit: string; usSub: number | null }[];
  history: { time: string; aqi: number | null }[]; // last 24 hours of US AQI
  dailyMax: Record<string, number>; // "2026-11-26" -> highest forecast US AQI that day
};

type Raw = {
  utc_offset_seconds?: number;
  hourly: Record<string, unknown[]> & { time: string[] };
};

// 8 hourly variables for 6 days = 1 call on Open-Meteo's counting (previously 26 variables,
// about 2.6 calls). Per-pollutant sub-indices are now worked out in src/lib/aqi.ts.
const HOURLY = ['us_aqi', 'european_aqi', ...POLLUTANTS];

/** Air quality for one location from Open-Meteo's global air-quality model (CAMS). */
export async function getAirQuality(lat: number, lon: number): Promise<AirQuality> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: HOURLY.join(','),
    past_days: '1', // the last 24 hours, for the graph and the 24-hour averages
    forecast_days: '5',
    timezone: 'auto',
  });
  const raw = await getJson<Raw>(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);
  const times: string[] = raw.hourly?.time ?? [];
  const series = (k: string) => (raw.hourly?.[k] ?? []).map(num);
  const offset = typeof raw.utc_offset_seconds === 'number' ? raw.utc_offset_seconds : 0;
  const now = localNow(offset);
  const end = hourIndex(times, now); // index of the current hour

  const usHourly = series('us_aqi');
  const euHourly = series('european_aqi');
  const byKey: Partial<Record<PollutantKey, (number | null)[]>> = {};
  for (const k of POLLUTANTS) byKey[k] = series(k);

  const history: { time: string; aqi: number | null }[] = [];
  for (let i = Math.max(0, end - 23); i <= end && i < times.length; i++) history.push({ time: times[i], aqi: usHourly[i] ?? null });

  const dailyMax: Record<string, number> = {};
  for (let i = end; i < times.length; i++) {
    const v = usHourly[i];
    if (v == null) continue;
    const d = times[i].slice(0, 10);
    dailyMax[d] = Math.max(dailyMax[d] ?? 0, Math.round(v));
  }

  const usSubs = computeUsSubIndices(byKey, end);
  const euSubs = computeEuSubIndices(byKey, end);
  const round = (v: number | null | undefined) => (v == null ? null : Math.round(v));

  return {
    time: now,
    us: { aqi: round(usHourly[end]), dominant: mainPollutant(usSubs) },
    eu: { aqi: round(euHourly[end]), dominant: mainPollutant(euSubs) },
    in: computeIndiaAqi(byKey, end),
    pollutants: POLLUTANTS.map((key) => {
      const v = byKey[key]?.[end] ?? null;
      const isCo = key === 'carbon_monoxide';
      return {
        key,
        label: POLLUTANT_LABEL[key],
        value: v == null ? null : isCo ? Math.round(v / 10) / 100 : Math.round(v),
        unit: isCo ? 'mg/m\u00b3' : '\u00b5g/m\u00b3',
        usSub: usSubs[key] ?? null,
      };
    }),
    history,
    dailyMax,
  };
}

/** Current US AQI and PM2.5 for many places in ONE request. */
export async function getAqiMany(points: { lat: number; lon: number }[]) {
  const params = new URLSearchParams({
    latitude: points.map((p) => p.lat).join(','),
    longitude: points.map((p) => p.lon).join(','),
    current: 'us_aqi,pm2_5',
    timezone: 'auto',
  });
  const raw = await getJson<unknown>(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);
  const list = (Array.isArray(raw) ? raw : [raw]) as { current?: Record<string, unknown> }[];
  return list.map((r) => {
    const aqi = num(r.current?.us_aqi);
    const pm = num(r.current?.pm2_5);
    return { aqi: aqi == null ? null : Math.round(aqi), pm25: pm == null ? null : Math.round(pm) };
  });
}
