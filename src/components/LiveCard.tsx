'use client';

/*
 * The big "Live AQI" card with the US / India / EU scale switch,
 * plus the current-weather panel beside it.
 */
import { useEffect, useState } from 'react';
import Icon from './Icon';
import { categorize, POLLUTANT_LABEL, scalePosition, SCALES, textOn, type PollutantKey, type ScaleId } from '@/lib/aqi';
import { dash } from '@/lib/format';
import type { WeatherIconName } from '@/lib/weatherCodes';

type Reading = { aqi: number | null; dominant: PollutantKey | null };
export type LiveAir = { us: Reading; in: Reading; eu: Reading; pm25: number | null; pm10: number | null };
export type LiveWeather = {
  temp: number | null; feelsLike: number | null; label: string; icon: WeatherIconName; humidity: number | null;
  wind: number | null; uv: number | null; visibilityKm: number | null; pressure: number | null;
  sunrise: string; sunset: string;
};

const STORAGE_KEY = 'taw-scale';

export default function LiveCard({ air, weather }: { air: LiveAir | null; weather: LiveWeather | null }) {
  const [scale, setScale] = useState<ScaleId>('us');
  useEffect(() => { // remember the visitor's preferred scale
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'us' || saved === 'in' || saved === 'eu') setScale(saved);
  }, []);
  const choose = (s: ScaleId) => { setScale(s); localStorage.setItem(STORAGE_KEY, s); };

  const reading = air?.[scale] ?? null;
  const cat = categorize(scale, reading?.aqi ?? null);
  const cats = SCALES[scale].cats;

  return (
    <div className="grid overflow-hidden rounded-2xl border border-line bg-white lg:grid-cols-[1.3fr_1fr]">
      <div className="min-w-0 p-5" style={{ background: cat ? `${cat.color}26` : undefined }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-ink">
            <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: cat?.color ?? '#9ca3af' }} />Live AQI
          </span>
          <div role="group" aria-label="AQI scale" className="inline-flex overflow-hidden rounded-full border border-line bg-white text-xs">
            {(Object.keys(SCALES) as ScaleId[]).map((s) => (
              <button key={s} type="button" onClick={() => choose(s)} aria-pressed={scale === s}
                className={`px-3 py-1 font-medium ${scale === s ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}>
                {SCALES[s].short}
              </button>
            ))}
          </div>
        </div>

        {reading?.aqi != null && cat ? (
          <>
            <div className="mt-3 flex flex-wrap items-end gap-4">
              <div>
                <span className="text-7xl font-bold leading-none tabular-nums" style={{ color: textOn(cat.color) === '#ffffff' ? cat.color : '#1f2633' }}>{reading.aqi}</span>
                <span className="block text-xs text-muted">{SCALES[scale].name}</span>
              </div>
              <div>
                <span className="block text-xs text-muted">Air quality is</span>
                <span className="inline-block rounded-lg px-3 py-1.5 text-xl font-semibold" style={{ background: cat.color, color: textOn(cat.color) }}>{cat.label}</span>
              </div>
            </div>
            <p className="mt-3 flex flex-wrap gap-x-5 text-sm">
              <span>PM2.5: <b>{dash(air?.pm25)} &micro;g/m&sup3;</b></span>
              <span>PM10: <b>{dash(air?.pm10)} &micro;g/m&sup3;</b></span>
              {reading.dominant && <span>Main pollutant: <b>{POLLUTANT_LABEL[reading.dominant]}</b></span>}
            </p>
            {/* Colour scale with a marker at the current value */}
            <div className="relative mt-5">
              <div className="flex h-2.5 overflow-hidden rounded-full">
                {cats.map((c) => <span key={c.label} className="flex-1" style={{ background: c.color }} />)}
              </div>
              <span className="absolute -top-1.5 h-5 w-1.5 -translate-x-1/2 rounded-full border-2 border-white bg-ink" style={{ left: `${scalePosition(scale, reading.aqi) * 100}%` }} />
              <div className="mt-1.5 hidden justify-between text-[11px] text-muted sm:flex">
                {cats.map((c) => <span key={c.label} className="flex-1 text-center">{c.label.replace(' for sensitive groups', ' (sensitive)')}</span>)}
              </div>
            </div>
            {scale === 'in' && <p className="mt-3 text-xs text-muted">India AQI is estimated from 24-hour averages of model data.</p>}
          </>
        ) : (
          <p className="mt-4 text-sm text-muted">
            {scale === 'in' ? 'Not enough data to estimate the India AQI here yet.' : 'Air quality data is not available for this location right now.'}
          </p>
        )}
      </div>

      <div className="min-w-0 border-t border-line p-5 lg:border-l lg:border-t-0">
        {weather ? (
          <>
            <div className="flex items-center gap-3">
              <Icon name={weather.icon} className="text-5xl" />
              <div>
                <p className="text-4xl font-semibold">{dash(weather.temp, '\u00b0C')}</p>
                <p className="text-sm text-muted">{weather.label} &middot; feels like {dash(weather.feelsLike, '\u00b0')}</p>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <Stat label="Humidity" value={dash(weather.humidity, ' %')} />
              <Stat label="Wind" value={dash(weather.wind, ' km/h')} />
              <Stat label="UV index" value={dash(weather.uv)} />
              <Stat label="Visibility" value={dash(weather.visibilityKm, ' km', 1)} />
              <Stat label="Pressure" value={dash(weather.pressure, ' hPa')} />
              <Stat label="Sunrise / sunset" value={`${weather.sunrise} / ${weather.sunset}`} small />
            </dl>
          </>
        ) : (
          <p className="text-sm text-muted">Current weather is unavailable right now.</p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-xl bg-page p-2.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`font-semibold ${small ? 'text-xs' : 'text-base'}`}>{value}</dd>
    </div>
  );
}
