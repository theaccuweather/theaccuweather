import Link from 'next/link';
import GlobeLogo from '@/components/GlobeLogo';
import SearchBox from '@/components/SearchBox';
import HomeLocal from '@/components/HomeLocal';
import Section from '@/components/Section';
import ErrorPanel from '@/components/ErrorPanel';
import { POPULAR_CITIES } from '@/lib/cities';
import { getAqiMany } from '@/lib/api/airQuality';
import { cityHref } from '@/lib/api/geocoding';
import { categorize } from '@/lib/aqi';

export const revalidate = 900; // rebuild this page at most every 15 minutes

export default async function HomePage() {
  // One request fetches AQI for all popular cities at once.
  const readings = await getAqiMany(POPULAR_CITIES).catch(() => null);
  const ranked = readings
    ? POPULAR_CITIES.map((c, i) => ({ ...c, aqi: readings[i]?.aqi ?? null }))
        .filter((c): c is typeof c & { aqi: number } => c.aqi != null)
        .sort((a, b) => b.aqi - a.aqi)
    : [];

  return (
    <div className="space-y-4">
      <section className="flex flex-col items-center gap-4 rounded-2xl bg-brand-night px-4 py-8 text-center text-white sm:py-10">
        <GlobeLogo size={200} interactive />
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Real-time air quality and weather, worldwide
        </h1>
        <p className="max-w-xl text-sm text-slate-300">
          Live AQI, PM2.5, PM10 and 7-day forecasts for any city.
        </p>
        <div className="w-full max-w-xl text-left text-ink">
          <SearchBox size="lg" />
        </div>
      </section>

      <HomeLocal />

      {ranked.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <CityList title="Most polluted major cities right now" cities={ranked.slice(0, 6)} />
          <CityList title="Cleanest major cities right now" cities={ranked.slice(-6).reverse()} />
        </div>
      ) : (
        <ErrorPanel title="Live city rankings are unavailable right now" detail="Please refresh in a few minutes." />
      )}

      <Section title="Popular cities">
        <div className="flex flex-wrap gap-2">
          {POPULAR_CITIES.map((c) => (
            <Link key={c.id} href={cityHref(c)} className="rounded-full border border-line px-3 py-1.5 text-sm hover:border-brand hover:text-brand">
              {c.name}
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}

function CityList({ title, cities }: { title: string; cities: { id: number; name: string; country: string; aqi: number }[] }) {
  return (
    <Section title={title}>
      <ul className="divide-y divide-line">
        {cities.map((c) => {
          const cat = categorize('us', c.aqi)!;
          return (
            <li key={c.id}>
              <Link href={cityHref(c)} className="flex items-center gap-3 py-2.5 hover:text-brand">
                <span className="h-8 w-1.5 rounded-full" style={{ background: cat.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{c.name}</span>
                  <span className="block text-xs text-muted">{c.country} &middot; {cat.label}</span>
                </span>
                <span className="text-xl font-semibold tabular-nums">{c.aqi}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-muted">US AQI &middot; <Link href="/ranking" className="text-brand hover:underline">See the full ranking</Link></p>
    </Section>
  );
}
