'use client';

/*
 * The top of the home page: map + big AQI card for the visitor's area.
 * Location comes from Vercel (approximate, from the IP address). Without it (e.g. on your own
 * computer) we use a big city in the visitor's time zone, or ask the browser.
 */
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import LiveCard from './LiveCard';
import MapBanner from './MapBanner';
import { focusGlobe } from './GlobeLogo';
import { POPULAR_CITIES } from '@/lib/cities';
import type { HeroData } from '@/lib/hero';

const TZ_CITY: Record<string, string> = {
  'Asia/Kolkata': 'New Delhi', 'Asia/Calcutta': 'New Delhi', 'Europe/London': 'London', 'Europe/Paris': 'Paris',
  'Europe/Berlin': 'Berlin', 'America/New_York': 'New York', 'America/Los_Angeles': 'Los Angeles',
  'America/Toronto': 'Toronto', 'Asia/Tokyo': 'Tokyo', 'Asia/Dubai': 'Dubai', 'Asia/Singapore': 'Singapore',
  'Australia/Sydney': 'Sydney', 'Asia/Shanghai': 'Shanghai', 'Asia/Karachi': 'Karachi', 'Asia/Dhaka': 'Dhaka',
};

function countryName(code: unknown): string {
  if (typeof code !== 'string' || !code) return '';
  try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase()) ?? ''; } catch { return ''; }
}

export default function HomeLocal() {
  const [state, setState] = useState<'loading' | 'ready' | 'unknown' | 'error'>('loading');
  const [data, setData] = useState<HeroData | null>(null);

  const load = useCallback(async (lat: number, lon: number, name: string, region: string) => {
    setState('loading');
    try {
      const q = new URLSearchParams({ lat: String(lat), lon: String(lon), name, region });
      const res = await fetch(`/api/summary?${q}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Request failed');
      const hero = json as HeroData;
      setData(hero);
      setState('ready');
      focusGlobe({ lat: hero.lat, lon: hero.lon, color: hero.usColor ?? undefined }, 'ip');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    const fallback = () => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
      const city = POPULAR_CITIES.find((c) => c.name === TZ_CITY[tz]);
      if (city) load(city.lat, city.lon, city.name, city.country);
      else setState('unknown');
    };
    fetch('/api/locate')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.lat === 'number' && typeof d.lon === 'number') load(d.lat, d.lon, d.city || 'Your location', countryName(d.country));
        else fallback();
      })
      .catch(fallback);
  }, [load]);

  const askBrowser = () => {
    navigator.geolocation?.getCurrentPosition(
      (p) => load(p.coords.latitude, p.coords.longitude, 'Your location', ''),
      () => setState('unknown'),
      { timeout: 10000 },
    );
  };

  if (state === 'loading') {
    return (
      <div aria-busy="true" aria-label="Loading air quality for your area">
        <div className="-mt-4 ml-[calc(50%-50vw)] h-56 w-screen animate-pulse bg-raised sm:h-72" />
        <div className="relative z-10 -mt-16 h-80 animate-pulse rounded-3xl border border-line bg-card sm:mx-6 sm:-mt-24" />
      </div>
    );
  }

  if (state !== 'ready' || !data) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-card p-5">
        <p className="flex-1 text-sm">
          {state === 'error' ? 'Live data for your area is unavailable right now.' : 'See air quality and weather where you are.'}
        </p>
        <button type="button" onClick={askBrowser} className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white">
          <Icon name="location" className="mr-1.5" />Use my location
        </button>
      </div>
    );
  }

  const more = `/here?lat=${data.lat}&lon=${data.lon}&name=${encodeURIComponent(data.name)}`;
  return (
    <div>
      <MapBanner lat={data.lat} lon={data.lon} color={data.usColor} />
      <div className="relative z-10 -mt-16 sm:-mt-24 sm:px-6">
        <LiveCard data={data} headingAs="h2" />
        <p className="mt-3 text-right text-sm">
          <Link href={more} className="font-medium text-link hover:underline">See pollutants, hourly forecast and 7 days</Link>
        </p>
      </div>
    </div>
  );
}
