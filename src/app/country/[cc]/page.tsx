import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import Section from '@/components/Section';
import LinkGrid from '@/components/LinkGrid';
import PlaceTable from '@/components/PlaceTable';
import { cityHref } from '@/lib/api/geocoding';
import { liveReadings } from '@/lib/live';
import { countryHref, getCountry, getStateOf, listStates, stateHref, topCitiesInCountry } from '@/lib/places';

// Live readings for the biggest cities refresh every 6 hours (244 country pages share the free API budget).
export const revalidate = 86_400;
export async function generateStaticParams() { return []; } // each page is built on its first visit

type Props = { params: Promise<{ cc: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cc } = await params;
  const country = getCountry(cc);
  if (!country) return { title: 'Country not found' };
  return {
    title: `${country.name} weather and air quality today`,
    description: `Weather forecasts and live air quality (AQI) for ${country.cityCount.toLocaleString('en')} cities and towns in ${country.name}, by state and region.`,
    alternates: { canonical: countryHref(country.code) },
  };
}

export default async function CountryPage({ params }: Props) {
  const { cc } = await params;
  if (cc !== cc.toLowerCase()) permanentRedirect(`/country/${cc.toLowerCase()}`);
  const country = getCountry(cc);
  if (!country) notFound();

  const top = topCitiesInCountry(country.code, 6);
  const live = await liveReadings(top, 86_400);
  const states = listStates(country.code);
  const rows = top.map((c, i) => {
    const st = getStateOf(c);
    return {
      id: c.id, name: c.name, href: cityHref(c),
      sub: st && st.code !== '_' && st.name !== c.name ? st.name : undefined,
      live: live?.[i] ?? null,
    };
  });

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ name: 'Countries', href: '/country' }, { name: country.name, href: countryHref(country.code) }]} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{country.name} weather and air quality</h1>
        <p className="mt-1 text-sm text-muted">
          {country.cityCount.toLocaleString('en')} cities and towns in {states.length} {states.length === 1 ? 'region' : 'states and regions'}
        </p>
      </div>
      <Section title={`Biggest cities in ${country.name}`}>
        <PlaceTable rows={rows} />
        <p className="mt-2 text-xs text-muted">
          {live ? 'Refreshed daily. Open a city for this hour’s weather, the 7-day forecast and live AQI.' : 'Live readings are unavailable right now. Open a city to try again.'}
        </p>
      </Section>
      <Section title="States and regions">
        <LinkGrid links={states.map((s) => ({ name: s.name, href: stateHref(s), note: s.cityCount.toLocaleString('en') }))} />
      </Section>
    </div>
  );
}
