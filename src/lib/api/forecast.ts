import { getJson, num } from './client';

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
  current: Record<string, unknown>;
  hourly: Record<string, unknown[]> & { time: string[] };
  daily: Record<string, unknown[]> & { time: string[] };
};

/** Current conditions, the next 24 hours and 7 days for one location (metric units). */
export async function getForecast(lat: number, lon: number): Promise<Forecast> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,uv_index,visibility,pressure_msl,weather_code,is_day',
    hourly: 'temperature_2m,precipitation_probability,weather_code,is_day',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,sunrise,sunset',
    timezone: 'auto', // all times come back in the location's own local time
    forecast_days: '7',
    wind_speed_unit: 'kmh',
  });
  const raw = await getJson<Raw>(`https://api.open-meteo.com/v1/forecast?${params}`);
  const c = raw.current;
  const vis = num(c.visibility);

  // Start the hourly strip at the current hour.
  const nowHour = String(c.time).slice(0, 13) + ':00';
  const times = raw.hourly.time;
  let start = times.findIndex((t) => t >= nowHour);
  if (start < 0) start = 0;

  const hourly = times.slice(start, start + 24).map((time, k) => {
    const i = start + k;
    return {
      time,
      temp: num(raw.hourly.temperature_2m[i]),
      pop: num(raw.hourly.precipitation_probability[i]),
      code: num(raw.hourly.weather_code[i]),
      isDay: raw.hourly.is_day[i] !== 0,
    };
  });

  const daily = raw.daily.time.map((date, i) => ({
    date,
    max: num(raw.daily.temperature_2m_max[i]),
    min: num(raw.daily.temperature_2m_min[i]),
    code: num(raw.daily.weather_code[i]),
    precip: num(raw.daily.precipitation_sum[i]),
    sunrise: String(raw.daily.sunrise[i] ?? ''),
    sunset: String(raw.daily.sunset[i] ?? ''),
  }));

  return {
    current: {
      time: String(c.time),
      temperature: num(c.temperature_2m),
      feelsLike: num(c.apparent_temperature),
      humidity: num(c.relative_humidity_2m),
      wind: num(c.wind_speed_10m),
      uv: num(c.uv_index),
      visibilityKm: vis == null ? null : Math.round(vis / 100) / 10,
      pressure: num(c.pressure_msl),
      code: num(c.weather_code),
      isDay: c.is_day !== 0,
    },
    hourly,
    daily,
  };
}

/** Temperature and sky for many places in ONE request (used by home and ranking pages). */
export async function getWeatherMany(points: { lat: number; lon: number }[]) {
  const params = new URLSearchParams({
    latitude: points.map((p) => p.lat).join(','),
    longitude: points.map((p) => p.lon).join(','),
    current: 'temperature_2m,weather_code,is_day',
    timezone: 'auto',
  });
  const raw = await getJson<unknown>(`https://api.open-meteo.com/v1/forecast?${params}`);
  const list = (Array.isArray(raw) ? raw : [raw]) as { current?: Record<string, unknown> }[];
  return list.map((r) => ({
    temp: num(r.current?.temperature_2m),
    code: num(r.current?.weather_code),
    isDay: r.current?.is_day !== 0,
  }));
}
