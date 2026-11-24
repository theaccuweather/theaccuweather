'use client';

/*
 * The big AQI / Weather card that overlaps the map (the main view of every city page,
 * and the "your location" view on the home page). Uses the AQI standard chosen in the header.
 */
import Link from 'next/link';
import { useState } from 'react';
import Icon, { type IconName } from './Icon';
import { Mascot, Skyline } from './Decor';
import { FavoriteButton, LocateButton, ShareButton } from './CityActions';
import { categorize, POLLUTANT_LABEL, scalePosition, SCALES, type ScaleId } from '@/lib/aqi';
import { useScale } from '@/lib/useScale';
import { dash, updatedLabel } from '@/lib/format';
import type { HeroAir, HeroData, HeroWeather } from '@/lib/hero';

type Tab = 'aqi' | 'weather';
type Props = { data: HeroData; href?: string; headingAs?: 'h1' | 'h2' };

export default function LiveCard({ data, href, headingAs = 'h1' }: Props) {
  // Weather is the main view; AQI is the second tab.
  const [tab, setTab] = useState<Tab>('weather');
  const [scale] = useScale();
  const cat = categorize(scale, data.air?.[scale].aqi ?? null);
  const Heading = headingAs;
  const place = [data.name, data.region].filter(Boolean).join(', ');

  return (
    <div>
      <div role="tablist" aria-label="Card view" className="ml-4 flex gap-1 sm:ml-8">
        <TabButton active={tab === 'weather'} onClick={() => setTab('weather')} icon="sun" label="Weather" />
        <TabButton active={tab === 'aqi'} onClick={() => setTab('aqi')} icon="wind" label="AQI" />
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-line bg-card shadow-2xl">
        {/* Weather tab: a sky-blue wash. AQI tab: a wash in the AQI colour. */}
        {(tab === 'weather' || cat) && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0"
            style={{ background: `linear-gradient(180deg, transparent 30%, ${tab === 'weather' ? '#0a7cff' : cat!.color}55 100%)` }} />
        )}
        <Skyline className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full text-ink opacity-[0.07] sm:h-32" />

        <div role="tabpanel" className="relative p-5 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-lg font-semibold sm:text-2xl">
                {tab === 'aqi' ? 'Real-time Air Quality Index (AQI)' : 'Real-time weather'}
              </p>
              <Heading className="mt-1 text-base font-semibold sm:text-xl">
                {href
                  ? <Link href={href} className="text-link underline underline-offset-4 hover:no-underline">{place}</Link>
                  : <span className="text-link">{place}</span>}
              </Heading>
              {data.updated && (
                <p className="mt-1 text-sm italic text-muted">
                  <span className="font-semibold text-ink">Last updated:</span> {updatedLabel(data.updated)} (local time)
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <LocateButton />
              <FavoriteButton name={data.name} region={data.region} href={href} />
              <ShareButton />
            </div>
          </div>

          {tab === 'aqi'
            ? <AqiPanel air={data.air} scale={scale} weather={data.weather} onWeather={() => setTab('weather')} />
            : <WeatherPanel weather={data.weather} air={data.air} scale={scale} onAqi={() => setTab('aqi')} />}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: IconName; label: string }) {
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick}
      className={`relative -mb-px flex items-center gap-2 rounded-t-xl border border-b-0 px-4 py-2.5 text-sm font-medium sm:px-5 ${
        active ? 'z-10 border-line bg-card text-ink' : 'border-transparent bg-raised/90 text-muted hover:text-ink'}`}>
      <Icon name={icon} />{label}
    </button>
  );
}

// ---------- AQI tab ----------
const END: Record<ScaleId, string> = { us: '500', in: '500+', eu: '100+' };
// Short names for the colour bar, so six labels fit side by side even on phones.
const SHORT: Record<string, string> = {
  'Unhealthy for sensitive groups': 'Sensitive',
  'Very unhealthy': 'V. unhealthy',
  Satisfactory: 'Satisf.',
  'Very poor': 'V. poor',
  'Extremely poor': 'Ext. poor',
};
const shortLabel = (l: string) => SHORT[l] ?? l;

function AqiPanel({ air, scale, weather, onWeather }: { air: HeroAir | null; scale: ScaleId; weather: HeroWeather | null; onWeather: () => void }) {
  const reading = air?.[scale] ?? null;
  const cat = categorize(scale, reading?.aqi ?? null);
  return (
    <div className="mt-6 grid items-end gap-6 lg:grid-cols-[minmax(0,1.15fr)_auto_minmax(0,1fr)]">
      <div className="min-w-0">
        {reading?.aqi != null && cat ? (
          <>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: cat.color }} />
                <span className="relative inline-flex h-3 w-3 rounded-full" style={{ background: cat.color }} />
              </span>
              Live AQI
            </p>
            <div className="mt-1 flex flex-wrap items-end gap-x-8 gap-y-3">
              <div className="flex items-end gap-2">
                <span className="taw-aqi-num text-7xl font-bold leading-none tabular-nums sm:text-8xl" style={{ color: cat.color }}>
                  {reading.aqi}
                </span>
                <span className="mb-2 text-xs text-muted">AQI ({SCALES[scale].short})</span>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted">Air quality is</p>
                <p className="taw-aqi-num mt-1 rounded-xl px-5 py-2 text-2xl font-semibold"
                  style={{ color: cat.color, background: `${cat.color}26` }}>
                  {cat.label}
                </p>
              </div>
            </div>
            <p className="mt-5 flex flex-wrap gap-x-10 gap-y-1 text-lg">
              <span className="text-muted">PM2.5 : <b className="text-ink">{dash(air?.pm25)}</b> <span className="text-xs">µg/m³</span></span>
              <span className="text-muted">PM10 : <b className="text-ink">{dash(air?.pm10)}</b> <span className="text-xs">µg/m³</span></span>
            </p>
            {reading.dominant && <p className="mt-1 text-sm text-muted">Main pollutant: <b className="text-ink">{POLLUTANT_LABEL[reading.dominant]}</b></p>}
            <ScaleBar scale={scale} value={reading.aqi} color={cat.color} />
            {scale === 'in' && <p className="mt-3 text-xs text-muted">India AQI is estimated from 24-hour averages of model data.</p>}
          </>
        ) : (
          <p className="text-sm text-muted">
            {scale === 'in' ? 'Not enough data to estimate the India AQI here yet. Try the US or EU standard in the header.' : 'Air quality data is not available for this location right now.'}
          </p>
        )}
      </div>

      <Mascot level={cat?.level ?? 0} className="taw-float mx-auto hidden h-40 w-44 lg:block" />

      <WeatherMini weather={weather} onOpen={onWeather} />
    </div>
  );
}

function ScaleBar({ scale, value, color }: { scale: ScaleId; value: number; color: string }) {
  const cats = SCALES[scale].cats;
  const ticks = [0, ...cats.slice(0, -1).map((c) => c.max), END[scale]];
  return (
    <div className="mt-6 max-w-lg">
      <div className="grid grid-cols-6 text-center text-[11px] font-medium leading-tight">
        {cats.map((c) => (
          <span key={c.label} title={c.label} className="min-w-0 truncate px-0.5">
            <span aria-hidden="true">{shortLabel(c.label)}</span>
            <span className="sr-only">{c.label}</span>
          </span>
        ))}
      </div>
      <div className="relative mt-1.5">
        <div className="flex h-1.5 overflow-hidden rounded-full">
          {cats.map((c) => <span key={c.label} className="flex-1" style={{ background: c.color }} />)}
        </div>
        <span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow"
          style={{ left: `${scalePosition(scale, value) * 100}%`, background: color }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-muted">
        {ticks.map((t) => <span key={String(t)}>{t}</span>)}
      </div>
    </div>
  );
}

function WeatherMini({ weather, onOpen }: { weather: HeroWeather | null; onOpen: () => void }) {
  return (
    <div className="relative rounded-2xl border border-line bg-card/80 backdrop-blur">
      <button type="button" onClick={onOpen} aria-label="Show weather details"
        className="absolute right-0 top-0 grid h-11 w-11 place-items-center rounded-bl-2xl rounded-tr-2xl bg-raised text-ink hover:text-link">
        <Icon name="arrow" className="-rotate-45" />
      </button>
      {weather ? (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 pb-4 pr-14 pt-5">
            <Icon name={weather.icon} className="text-5xl" label={weather.label} />
            <p className="text-4xl font-semibold tabular-nums">
              {weather.temp == null ? '—' : Math.round(weather.temp)}<span className="ml-1 align-top text-lg">°C</span>
            </p>
            <p className="text-lg text-muted">{weather.label}</p>
          </div>
          <dl className="grid grid-cols-3 divide-x divide-line border-t border-line text-center">
            <MiniStat icon="droplet" label="Humidity" value={dash(weather.humidity, ' %')} />
            <MiniStat icon="wind" label="Wind speed" value={dash(weather.wind, ' km/h', 1)} />
            <MiniStat icon="uv" label="UV index" value={dash(weather.uv)} />
          </dl>
        </>
      ) : (
        <p className="p-5 pr-14 text-sm text-muted">Current weather is unavailable right now.</p>
      )}
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div className="px-2 py-3">
      <dt className="text-xs text-muted sm:text-sm"><Icon name={icon} className="mr-1" />{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}

// ---------- Weather tab ----------
function WeatherPanel({ weather, air, scale, onAqi }: { weather: HeroWeather | null; air: HeroAir | null; scale: ScaleId; onAqi: () => void }) {
  const reading = air?.[scale] ?? null;
  const cat = categorize(scale, reading?.aqi ?? null);
  return (
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      {weather ? (
        <div className="min-w-0">
          <div className="flex items-center gap-4">
            <Icon name={weather.icon} className="text-6xl" label={weather.label} />
            <div>
              <p className="text-6xl font-semibold tabular-nums">{weather.temp == null ? '—' : Math.round(weather.temp)}<span className="ml-1 align-top text-2xl">°C</span></p>
              <p className="text-muted">{weather.label} · feels like {dash(weather.feelsLike, '°')}</p>
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat icon="droplet" label="Humidity" value={dash(weather.humidity, ' %')} />
            <Stat icon="wind" label="Wind speed" value={dash(weather.wind, ' km/h', 1)} />
            <Stat icon="uv" label="UV index" value={dash(weather.uv)} />
            <Stat icon="eye" label="Visibility" value={dash(weather.visibilityKm, ' km', 1)} />
            <Stat icon="gauge" label="Pressure" value={dash(weather.pressure, ' hPa')} />
            <Stat icon="sun" label="Sunrise / sunset" value={`${weather.sunrise} / ${weather.sunset}`} small />
          </dl>
        </div>
      ) : (
        <p className="text-sm text-muted">Current weather is unavailable right now.</p>
      )}

      <div className="relative rounded-2xl border border-line bg-card/80 p-5 pr-14">
        <button type="button" onClick={onAqi} aria-label="Show air quality details"
          className="absolute right-0 top-0 grid h-11 w-11 place-items-center rounded-bl-2xl rounded-tr-2xl bg-raised text-ink hover:text-link">
          <Icon name="arrow" className="-rotate-45" />
        </button>
        <p className="text-sm text-muted">Air quality now</p>
        {reading?.aqi != null && cat ? (
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <span className="taw-aqi-num text-5xl font-bold leading-none tabular-nums" style={{ color: cat.color }}>{reading.aqi}</span>
            <span className="taw-aqi-num rounded-lg px-3 py-1 text-sm font-semibold" style={{ color: cat.color, background: `${cat.color}26` }}>{cat.label}</span>
            <span className="text-xs text-muted">{SCALES[scale].name}</span>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">Not available right now.</p>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, small }: { icon: IconName; label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-raised/60 p-3">
      <dt className="text-xs text-muted"><Icon name={icon} className="mr-1" />{label}</dt>
      <dd className={`mt-0.5 font-semibold ${small ? 'text-sm' : 'text-lg'}`}>{value}</dd>
    </div>
  );
}
