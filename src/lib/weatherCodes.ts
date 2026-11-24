// WMO weather codes (used by Open-Meteo) -> readable label + icon name.
export type WeatherIconName =
  | 'sun' | 'moon' | 'cloud-sun' | 'cloud-moon' | 'cloud' | 'smog'
  | 'cloud-rain' | 'cloud-showers-heavy' | 'cloud-sun-rain' | 'snowflake' | 'bolt';

const MAP: Record<number, [string, WeatherIconName, WeatherIconName?]> = {
  0: ['Clear sky', 'sun', 'moon'],
  1: ['Mainly clear', 'sun', 'moon'],
  2: ['Partly cloudy', 'cloud-sun', 'cloud-moon'],
  3: ['Overcast', 'cloud'],
  45: ['Fog', 'smog'],
  48: ['Freezing fog', 'smog'],
  51: ['Light drizzle', 'cloud-rain'],
  53: ['Drizzle', 'cloud-rain'],
  55: ['Heavy drizzle', 'cloud-rain'],
  56: ['Freezing drizzle', 'cloud-rain'],
  57: ['Freezing drizzle', 'cloud-rain'],
  61: ['Light rain', 'cloud-rain'],
  63: ['Rain', 'cloud-rain'],
  65: ['Heavy rain', 'cloud-showers-heavy'],
  66: ['Freezing rain', 'cloud-rain'],
  67: ['Freezing rain', 'cloud-showers-heavy'],
  71: ['Light snow', 'snowflake'],
  73: ['Snow', 'snowflake'],
  75: ['Heavy snow', 'snowflake'],
  77: ['Snow grains', 'snowflake'],
  80: ['Light showers', 'cloud-sun-rain', 'cloud-rain'],
  81: ['Showers', 'cloud-rain'],
  82: ['Heavy showers', 'cloud-showers-heavy'],
  85: ['Snow showers', 'snowflake'],
  86: ['Heavy snow showers', 'snowflake'],
  95: ['Thunderstorm', 'bolt'],
  96: ['Thunderstorm with hail', 'bolt'],
  99: ['Thunderstorm with hail', 'bolt'],
};

export function describeWeather(code: number | null, isDay = true): { label: string; icon: WeatherIconName } {
  const m = code == null ? undefined : MAP[code];
  if (!m) return { label: 'Weather unavailable', icon: 'cloud' };
  return { label: m[0], icon: !isDay && m[2] ? m[2] : m[1] };
}
