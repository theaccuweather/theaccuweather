import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import CityView, { type Related } from '@/components/CityView';
import type { Crumb } from '@/components/Breadcrumbs';
import { cityHref, getPlace, slugify } from '@/lib/api/geocoding';
import { citiesInState, countryHref, getCityById, getCountry, getStateOf, stateHref } from '@/lib/places';

export const revalidate = 3600; // the page is rebuilt at most hourly; its weather data is reused for 1–3 hours
export async function generateStaticParams() { return []; } // every city page is built on its first visit, then cached

type Props = { params: Promise<{ id: string; slug: string }> };
type CityInfo = {
  id: number; name: string; lat: number; lon: number; region: string;
  crumbs: Crumb[]; related: Related | null; refresh: number;
};

async function load(idText: string): Promise<CityInfo | null> {
  const id = Number(idText);
  if (!Number.isInteger(id) || id <= 0) return null;

  // 1. Our own city list (31,799 cities): no API call, and we know the state and country.
  const c = getCityById(id);
  if (c) {
    const country = getCountry(c.cc);
    const state = getStateOf(c);
    const crumbs: Crumb[] = [];
    if (country) crumbs.push({ name: country.name, href: countryHref(country.code) });
    if (state) crumbs.push({ name: state.name, href: stateHref(state) });
    crumbs.push({ name: c.name, href: cityHref(c) });
    const others = state ? citiesInState(state.cc, state.code).filter((x) => x.id !== c.id).slice(0, 12) : [];
    return {
      id, name: c.name, lat: c.lat, lon: c.lon,
      region: [state && state.code !== '_' && state.name !== c.name ? state.name : null, country?.name].filter(Boolean).join(', '),
      crumbs,
      related: state && others.length > 0
        ? { title: `More places in ${state.name}`, links: others.map((o) => ({ name: o.name, href: cityHref(o) })), more: { name: state.name, href: stateHref(state) } }
        : null,
      // Cities of 1 million+ refresh hourly; smaller ones every 3 hours, to stay inside the free API budget.
      refresh: c.population >= 1_000_000 ? 3600 : 10_800,
    };
  }

  // 2. Smaller places found through search: look them up (cached for a week).
  const p = await getPlace(id);
  if (!p) return null;
  const country = p.country_code ? getCountry(p.country_code) : null;
  const crumbs: Crumb[] = [];
  if (country) crumbs.push({ name: country.name, href: countryHref(country.code) });
  crumbs.push({ name: p.name, href: cityHref(p) });
  return {
    id, name: p.name, lat: p.latitude, lon: p.longitude,
    region: [p.admin1, p.country].filter((x): x is string => Boolean(x) && x !== p.name).join(', '),
    crumbs, related: null, refresh: 10_800,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const place = await load(id).catch(() => null);
  if (!place) return { title: 'City not found' };
  const where = place.region ? `${place.name}, ${place.region}` : place.name;
  return {
    title: `${place.name} weather and AQI today`,
    description: `Current weather, hourly and 7-day forecast, plus live air quality (AQI, PM2.5, PM10) for ${where}.`,
    alternates: { canonical: cityHref(place) },
  };
}

export default async function CityPage({ params }: Props) {
  const { id, slug } = await params;
  const place = await load(id);
  if (!place) notFound();
  if (slug !== slugify(place.name)) permanentRedirect(cityHref(place)); // one URL per city (SEO)

  return (
    <CityView
      name={place.name}
      region={place.region}
      lat={place.lat}
      lon={place.lon}
      href={cityHref(place)}
      crumbs={place.crumbs}
      related={place.related}
      refresh={place.refresh}
    />
  );
}
