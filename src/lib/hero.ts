// The data behind the big AQI / weather card, built from the forecast and air-quality results.
// Used by city pages (on the server) and by the home page's "your location" card (via /api/summary).
import type { AirQuality } from '@/lib/api/airQuality';
import type { Forecast } from '@/lib/api/forecast';
import { categorize, type PollutantKey } from '@/lib/aqi';
import { describeWeather, type WeatherIconName } from '@/lib/weatherCodes';
import { clockLabel } from '@/lib/format';

type Reading = { aqi: number | null; dominant: PollutantKey | null };

export type HeroAir = { us: Reading; in: Reading; eu: Reading; pm25: number | null; pm10: number | null };
export type HeroWeather = {
  temp: number | null; feelsLike: number | null; label: string; icon: WeatherIconName;
  humidity: number | null; wind: number | null; uv: number | null; visibilityKm: number | null;
  pressure: number | null; sunrise: string; sunset: string;
};
export type HeroData = {
  name: string;
  region: string; // e.g. "Karnataka, India"
  lat: number;
  lon: number;
  updated: string | null; // local time at the place
  usColor: string | null; // US AQI colour, used for the globe ring and map marker
  air: HeroAir | null;
  weather: HeroWeather | null;
};

export function buildHero(
  name: string, region: string, lat: number, lon: number,
  forecast: Forecast | null, air: AirQuality | null,
): HeroData {
  const pm = (k: string) => air?.pollutants.find((p) => p.key === k)?.value ?? null;
  const c = forecast?.current;
  const today = forecast?.daily[0];
  return {
    name,
    region,
    lat,
    lon,
    updated: c?.time ?? air?.time ?? null,
    usColor: categorize('us', air?.us.aqi ?? null)?.color ?? null,
    air: air ? { us: air.us, in: air.in, eu: air.eu, pm25: pm('pm2_5'), pm10: pm('pm10') } : null,
    weather: c
      ? {
          temp: c.temperature,
          feelsLike: c.feelsLike,
          ...describeWeather(c.code, c.isDay),
          humidity: c.humidity,
          wind: c.wind,
          uv: c.uv,
          visibilityKm: c.visibilityKm,
          pressure: c.pressure,
          sunrise: today ? clockLabel(today.sunrise) : '—',
          sunset: today ? clockLabel(today.sunset) : '—',
        }
      : null,
  };
}
