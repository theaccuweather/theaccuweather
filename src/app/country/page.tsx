import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';
import Section from '@/components/Section';
import LinkGrid from '@/components/LinkGrid';
import { CONTINENTS, countryHref, listCountries } from '@/lib/places';

export const metadata: Metadata = {
  title: 'Weather and air quality by country',
  description: 'Browse weather forecasts and live air quality (AQI) for cities in every country and territory.',
  alternates: { canonical: '/country' },
};

export default function CountriesPage() {
  const all = listCountries();
  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ name: 'Countries', href: '/country' }]} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Weather and air quality by country</h1>
        <p className="mt-1 text-sm text-muted">
          {all.length} countries and territories. The number beside each is how many of its cities and towns we cover.
        </p>
      </div>
      {CONTINENTS.map((ct) => {
        const list = all.filter((c) => c.continent === ct.code);
        if (list.length === 0) return null;
        return (
          <Section key={ct.code} title={ct.name}>
            <LinkGrid links={list.map((c) => ({ name: c.name, href: countryHref(c.code), note: c.cityCount.toLocaleString('en') }))} />
          </Section>
        );
      })}
    </div>
  );
}
