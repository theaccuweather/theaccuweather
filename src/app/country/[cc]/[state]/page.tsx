import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import Section from '@/components/Section';
import LinkGrid from '@/components/LinkGrid';
import { cityHref } from '@/lib/api/geocoding';
import { citiesInState, countryHref, getCountry, getStateBySlug, listStates, stateHref } from '@/lib/places';

// No live data on state pages (2,787 of them would use up the free API budget), so they never
// need refreshing: each is built on its first visit and kept until the next deploy.
export const revalidate = false;
export async function generateStaticParams() { return []; }

type Props = { params: Promise<{ cc: string; state: string }> };
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

function load(cc: string, slug: string) {
  const country = getCountry(cc);
  const state = country ? getStateBySlug(country.code, slug) : null;
  return country && state ? { country, state } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cc, state: slug } = await params;
  const found = load(cc, slug);
  if (!found) return { title: 'Region not found' };
  const { country, state } = found;
  return {
    title: `${state.name}, ${country.name}: weather and air quality`,
    description: `Weather forecasts and live air quality (AQI) for ${state.cityCount.toLocaleString('en')} cities and towns in ${state.name}, ${country.name}.`,
    alternates: { canonical: stateHref(state) },
  };
}

export default async function StatePage({ params }: Props) {
  const { cc, state: slug } = await params;
  const found = load(cc, slug);
  if (!found) notFound();
  const { country, state } = found;
  const cities = citiesInState(country.code, state.code);
  const siblings = listStates(country.code).filter((s) => s.slug !== state.slug);

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[
        { name: 'Countries', href: '/country' },
        { name: country.name, href: countryHref(country.code) },
        { name: state.name, href: stateHref(state) },
      ]} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{state.name} weather and air quality</h1>
        <p className="mt-1 text-sm text-muted">
          {cities.length.toLocaleString('en')} {cities.length === 1 ? 'city' : 'cities and towns'} in {state.name}, {country.name}.
          Open one for its current weather, 7-day forecast and live AQI.
        </p>
      </div>
      <Section title="Cities and towns">
        <LinkGrid links={cities.map((c) => ({ name: c.name, href: cityHref(c), note: c.population ? compact.format(c.population) : undefined }))} />
        <p className="mt-3 text-xs text-muted">Sorted by population (shown beside each name).</p>
      </Section>
      {siblings.length > 0 && (
        <Section title={`Other regions in ${country.name}`}>
          <LinkGrid links={siblings.map((s) => ({ name: s.name, href: stateHref(s) }))} />
        </Section>
      )}
    </div>
  );
}
