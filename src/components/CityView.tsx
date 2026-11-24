import LiveCard from './LiveCard';
import MapBanner from './MapBanner';
import GlobeFocus from './GlobeFocus';
import Section from './Section';
import ErrorPanel from './ErrorPanel';
import PollutantGrid from './PollutantGrid';
import AqiHistoryChart from './AqiHistoryChart';
import HourlyStrip from './HourlyStrip';
import DailyForecast from './DailyForecast';
import { getForecast } from '@/lib/api/forecast';
import { getAirQuality } from '@/lib/api/airQuality';
import { isRateLimit } from '@/lib/api/client';
import { categorize, HEALTH_ADVICE } from '@/lib/aqi';
import { buildHero } from '@/lib/hero';

type Props = { name: string; region: string; lat: number; lon: number; href?: string };

/** Everything on a city page. Weather and AQI load in parallel; if one fails, the other still shows. */
export default async function CityView({ name, region, lat, lon, href }: Props) {
  const [fc, aq] = await Promise.allSettled([getForecast(lat, lon), getAirQuality(lat, lon)]);
  // If the provider is rate-limiting us, or nothing loaded, throw: Next.js then keeps showing
  // the last good version of this page instead of caching an error version for an hour.
  const failed = [fc, aq].filter((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (failed.length === 2 || failed.some((f) => isRateLimit(f.reason))) throw failed[0].reason;

  const forecast = fc.status === 'fulfilled' ? fc.value : null;
  const air = aq.status === 'fulfilled' ? aq.value : null;
  const hero = buildHero(name, region, lat, lon, forecast, air);
  const usCat = categorize('us', air?.us.aqi ?? null);

  return (
    <div className="space-y-4">
      <GlobeFocus lat={lat} lon={lon} color={usCat?.color} />

      <div>
        <MapBanner lat={lat} lon={lon} color={hero.usColor} />
        <div className="relative z-10 -mt-16 sm:-mt-24 sm:px-6">
          {air || forecast ? <LiveCard data={hero} href={href} headingAs="h1" /> : <ErrorPanel title={`We couldn't load live data for ${name}`} />}
        </div>
      </div>

      {forecast ? (
        <>
          <Section title="Next 24 hours"><HourlyStrip hours={forecast.hourly} /></Section>
          <Section title="7-day weather and AQI forecast"><DailyForecast days={forecast.daily} aqiByDay={air?.dailyMax ?? {}} /></Section>
        </>
      ) : (
        <ErrorPanel title="The weather forecast is unavailable right now" />
      )}

      {air ? (
        <>
          <Section title="Major air pollutants"><PollutantGrid pollutants={air.pollutants} /></Section>
          <Section title="AQI graph: last 24 hours"><AqiHistoryChart history={air.history} /></Section>
        </>
      ) : (
        <ErrorPanel title="Air quality data is unavailable right now" />
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
