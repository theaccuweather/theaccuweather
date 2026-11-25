import Link from 'next/link';
import GlobeLogo from '@/components/GlobeLogo';
import HomeLocal from '@/components/HomeLocal';
import SavedCities from '@/components/SavedCities';
import Section from '@/components/Section';
import ErrorPanel from '@/components/ErrorPanel';
import { POPULAR_CITIES } from '@/lib/cities';
import { currentRanking } from '@/lib/rankings';
import { cityHref } from '@/lib/api/geocoding';
import { categorize } from '@/lib/aqi';

export const revalidate = 3600; // rebuild this page at most once an hour

export default async function HomePage() {
  // Top and bottom cities: from the collector's database when it's set up (240 cities),
  // otherwise one live request for the 40 popular cities (shared with the ranking page).
  const ranking = await currentRanking();
  const ranked = (ranking?.rows ?? []).filter((r): r is typeof r & { aqi: number } => r.aqi != null);

  return (
    <div className="space-y-4">
      <HomeLocal />
      <SavedCities />

      {ranked.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <CityList title="Most polluted major cities right now" cities={ranked.slice(0, 6)} />
          <CityList title="Cleanest major cities right now" cities={ranked.slice(-6).reverse()} />
        </div>
      ) : (
        <ErrorPanel title="Live city rankings are unavailable right now" detail="Please refresh in a few minutes." />
      )}

      <section className="flex flex-col items-center gap-6 rounded-2xl border border-line bg-card px-5 py-8 text-center md:flex-row md:items-center md:gap-10 md:px-10 md:text-left">
        <GlobeLogo size={180} interactive />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Real-time air quality and weather, worldwide</h1>
          <p className="mt-2 text-sm text-muted">Live AQI, PM2.5, PM10 and 7-day forecasts for any city. Drag the globe to spin it.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
            {POPULAR_CITIES.map((c) => (
              <Link key={c.id} href={cityHref(c)} className="rounded-full border border-line px-3 py-1.5 text-sm hover:border-link hover:text-link">
                {c.name}
              </Link>
            ))}
          </div>
          <Link href="/country" className="mt-4 inline-block text-sm font-medium text-link hover:underline">
            Browse all countries, states and cities
          </Link>
        </div>
      </section>
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
              <Link href={cityHref(c)} className="flex items-center gap-3 py-2.5 hover:text-link">
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
      <p className="mt-2 text-xs text-muted">US AQI &middot; <Link href="/ranking" className="text-link hover:underline">See the full ranking</Link></p>
    </Section>
  );
}
