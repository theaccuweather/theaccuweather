import Link from 'next/link';
import LiveCard from './LiveCard';
import GlobeFocus from './GlobeFocus';
import Section from './Section';
import ErrorPanel from './ErrorPanel';
import PollutantGrid from './PollutantGrid';
import AqiHistoryChart from './AqiHistoryChart';
import HourlyStrip from './HourlyStrip';
import DailyForecast from './DailyForecast';
import { getForecast } from '@/lib/api/forecast';
import { getAirQuality } from '@/lib/api/airQuality';
import { categorize, HEALTH_ADVICE } from '@/lib/aqi';
import { describeWeather } from '@/lib/weatherCodes';
import { clockLabel, updatedLabel } from '@/lib/format';

type Props = { name: string; lat: number; lon: number; crumbs: string[] };

/** Everything on a city page. Weather and AQI load in parallel; if one fails, the other still shows. */
export default async function CityView({ name, lat, lon, crumbs }: Props) {
  const [fc, aq] = await Promise.allSettled([getForecast(lat, lon), getAirQuality(lat, lon)]);
  const forecast = fc.status === 'fulfilled' ? fc.value : null;
  const air = aq.status === 'fulfilled' ? aq.value : null;
  const usCat = categorize('us', air?.us.aqi ?? null);
  const updated = forecast?.current.time ?? air?.time;
  const today = forecast?.daily[0];
  const pm = (k: string) => air?.pollutants.find((p) => p.key === k)?.value ?? null;

  return (
    <div className="space-y-4">
      <GlobeFocus lat={lat} lon={lon} color={usCat?.color} />

      <div>
        <p className="text-xs text-muted">
          <Link href="/" className="hover:text-brand">Home</Link>
          {crumbs.map((c) => <span key={c}> &rsaquo; {c}</span>)} &rsaquo; {name}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{name} air quality (AQI) and weather</h1>
        <p className="text-sm text-muted">
          Real-time PM2.5, PM10 and weather in {name}
          {updated && <> &middot; Last updated: {updatedLabel(updated)} (local time)</>}
        </p>
      </div>

      {air || forecast ? (
        <LiveCard
          air={air ? { us: air.us, in: air.in, eu: air.eu, pm25: pm('pm2_5'), pm10: pm('pm10') } : null}
          weather={forecast ? {
            temp: forecast.current.temperature,
            feelsLike: forecast.current.feelsLike,
            ...describeWeather(forecast.current.code, forecast.current.isDay),
            humidity: forecast.current.humidity,
            wind: forecast.current.wind,
            uv: forecast.current.uv,
            visibilityKm: forecast.current.visibilityKm,
            pressure: forecast.current.pressure,
            sunrise: today ? clockLabel(today.sunrise) : '\u2014',
            sunset: today ? clockLabel(today.sunset) : '\u2014',
          } : null}
        />
      ) : (
        <ErrorPanel title={`We couldn't load live data for ${name}`} />
      )}

      {air ? (
        <>
          <Section title="Major air pollutants"><PollutantGrid pollutants={air.pollutants} /></Section>
          <Section title="AQI graph: last 24 hours"><AqiHistoryChart history={air.history} /></Section>
        </>
      ) : (
        <ErrorPanel title="Air quality data is unavailable right now" />
      )}

      {forecast ? (
        <>
          <Section title="Next 24 hours"><HourlyStrip hours={forecast.hourly} /></Section>
          <Section title="7-day weather and AQI forecast"><DailyForecast days={forecast.daily} aqiByDay={air?.dailyMax ?? {}} /></Section>
        </>
      ) : (
        <ErrorPanel title="The weather forecast is unavailable right now" />
      )}

      {usCat && (
        <Section title="Health advice">
          <ul className="space-y-1.5 text-sm">
            {HEALTH_ADVICE[usCat.level].map((t) => (
              <li key={t} className="flex gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: usCat.color }} />{t}</li>
            ))}
          </ul>
        </Section>
      )}

      <p className="text-xs text-muted">Air quality is modelled data from CAMS via Open-Meteo, so it is an area estimate rather than a single sensor reading.</p>
    </div>
  );
}
