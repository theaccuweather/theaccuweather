import { getJson, num } from './client';
import { computeIndiaAqi, POLLUTANTS, POLLUTANT_LABEL, type PollutantKey } from '@/lib/aqi';

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
  current: Record<string, unknown>;
  hourly: Record<string, unknown[]> & { time: string[] };
};

const EU_SUB: PollutantKey[] = ['pm2_5', 'pm10', 'nitrogen_dioxide', 'ozone', 'sulphur_dioxide'];

/** Pick the pollutant with the highest sub-index: that's the "main pollutant". */
function dominant(c: Record<string, unknown>, prefix: string, keys: readonly PollutantKey[]): PollutantKey | null {
  let best: PollutantKey | null = null;
  let max = -1;
  for (const k of keys) {
    const v = num(c[`${prefix}${k}`]);
    if (v != null && v > max) { max = v; best = k; }
  }
  return best;
}

/** Air quality for one location from Open-Meteo's global air-quality model (CAMS). */
export async function getAirQuality(lat: number, lon: number): Promise<AirQuality> {
  const current = [
    'us_aqi', 'european_aqi', ...POLLUTANTS,
    ...POLLUTANTS.map((p) => `us_aqi_${p}`),
    ...EU_SUB.map((p) => `european_aqi_${p}`),
  ].join(',');
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current,
    hourly: ['us_aqi', ...POLLUTANTS].join(','),
    past_days: '1', // gives us the last 24 hours for the graph and India AQI
    forecast_days: '5',
    timezone: 'auto',
  });
  const raw = await getJson<Raw>(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);
  const c = raw.current;
  const times = raw.hourly.time;

  // Index of the current hour inside the hourly arrays.
  const nowHour = String(c.time).slice(0, 13) + ':00';
  let end = times.indexOf(nowHour);
  if (end < 0) end = Math.max(0, times.findIndex((t) => t > nowHour) - 1);

  const usHourly = raw.hourly.us_aqi.map(num);
  const history: { time: string; aqi: number | null }[] = [];
  for (let i = Math.max(0, end - 23); i <= end; i++) history.push({ time: times[i], aqi: usHourly[i] });

  const dailyMax: Record<string, number> = {};
  for (let i = end; i < times.length; i++) {
    const v = usHourly[i];
    if (v == null) continue;
    const d = times[i].slice(0, 10);
    dailyMax[d] = Math.max(dailyMax[d] ?? 0, Math.round(v));
  }

  const hourlyByKey: Partial<Record<PollutantKey, (number | null)[]>> = {};
  for (const k of POLLUTANTS) hourlyByKey[k] = (raw.hourly[k] ?? []).map(num);

  const round = (v: number | null) => (v == null ? null : Math.round(v));

  return {
    time: String(c.time),
    us: { aqi: round(num(c.us_aqi)), dominant: dominant(c, 'us_aqi_', POLLUTANTS) },
    eu: { aqi: round(num(c.european_aqi)), dominant: dominant(c, 'european_aqi_', EU_SUB) },
    in: computeIndiaAqi(hourlyByKey, end),
    pollutants: POLLUTANTS.map((key) => {
      const v = num(c[key]);
      const isCo = key === 'carbon_monoxide';
      return {
        key,
        label: POLLUTANT_LABEL[key],
        value: v == null ? null : isCo ? Math.round(v / 10) / 100 : Math.round(v),
        unit: isCo ? 'mg/m\u00b3' : '\u00b5g/m\u00b3',
        usSub: num(c[`us_aqi_${key}`]),
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
