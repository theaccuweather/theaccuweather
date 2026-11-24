'use client';

/*
 * "Your location" card on the home page. Uses the visitor's approximate location
 * (from Vercel), or asks the browser if that isn't available.
 */
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import { focusGlobe } from './GlobeLogo';
import { textOn } from '@/lib/aqi';
import type { WeatherIconName } from '@/lib/weatherCodes';

type Summary = {
  lat: number; lon: number; aqi: number | null; label: string | null; color: string | null;
  pm25: number | null; pm10: number | null; temp: number | null; humidity: number | null; wind: number | null;
  weather: { label: string; icon: WeatherIconName } | null;
};

export default function HomeLocal() {
  const [state, setState] = useState<'loading' | 'ready' | 'unknown' | 'error'>('loading');
  const [data, setData] = useState<Summary | null>(null);
  const [city, setCity] = useState<string | null>(null);

  const load = useCallback(async (lat: number, lon: number) => {
    setState('loading');
    try {
      const res = await fetch(`/api/summary?lat=${lat}&lon=${lon}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
      setState('ready');
      focusGlobe({ lat, lon, color: json.color ?? undefined }, 'ip');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    fetch('/api/locate')
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.lat === 'number') { setCity(d.city); load(d.lat, d.lon); }
        else setState('unknown');
      })
      .catch(() => setState('unknown'));
  }, [load]);

  const askBrowser = () => {
    navigator.geolocation?.getCurrentPosition(
      (p) => { setCity(null); load(p.coords.latitude, p.coords.longitude); },
      () => setState('unknown'),
      { timeout: 10000 },
    );
  };

  if (state === 'loading') return <div className="h-40 animate-pulse rounded-2xl border border-line bg-white" aria-label="Loading your local air quality" />;

  if (state !== 'ready' || !data) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-5">
        <p className="flex-1 text-sm">
          {state === 'error' ? 'Live data for your area is unavailable right now.' : 'See air quality and weather where you are.'}
        </p>
        <button type="button" onClick={askBrowser} className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white">
          <Icon name="location" className="mr-1.5" />Use my location
        </button>
      </div>
    );
  }

  const name = city ?? 'Your location';
  const href = `/here?lat=${data.lat}&lon=${data.lon}&name=${encodeURIComponent(name)}`;
  return (
    <div className="grid overflow-hidden rounded-2xl border border-line bg-white md:grid-cols-[1.25fr_1fr]">
      <div className="p-5" style={{ background: data.color ? `${data.color}24` : undefined }}>
        <p className="text-xs font-semibold text-muted">Your location: {name}</p>
        <div className="mt-2 flex flex-wrap items-end gap-4">
          <div>
            <span className="text-6xl font-bold leading-none tabular-nums">{data.aqi ?? '\u2014'}</span>
            <span className="block text-xs text-muted">AQI (US)</span>
          </div>
          {data.label && data.color && (
            <span className="rounded-lg px-3 py-1.5 text-lg font-semibold" style={{ background: data.color, color: textOn(data.color) }}>{data.label}</span>
          )}
        </div>
        <p className="mt-3 text-sm">PM2.5: <b>{data.pm25 ?? '\u2014'} &micro;g/m&sup3;</b> &nbsp; PM10: <b>{data.pm10 ?? '\u2014'} &micro;g/m&sup3;</b></p>
      </div>
      <div className="flex flex-col justify-between gap-3 border-t border-line p-5 md:border-l md:border-t-0">
        {data.weather && (
          <div className="flex items-center gap-3">
            <Icon name={data.weather.icon} className="text-4xl" />
            <div>
              <p className="text-3xl font-semibold">{data.temp == null ? '\u2014' : `${Math.round(data.temp)}\u00b0C`}</p>
              <p className="text-sm text-muted">{data.weather.label}</p>
            </div>
          </div>
        )}
        <p className="text-sm text-muted">Humidity {data.humidity ?? '\u2014'}% &middot; Wind {data.wind == null ? '\u2014' : Math.round(data.wind)} km/h</p>
        <Link href={href} className="text-sm font-medium text-brand hover:underline">See the full forecast</Link>
      </div>
    </div>
  );
}
