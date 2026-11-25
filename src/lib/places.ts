// City, state and country lists used by the country and state pages, city breadcrumbs and
// the sitemap. Source: GeoNames cities with more than 15,000 people (CC BY 4.0), trimmed into
// src/data/places.ts. Server-side only: it holds ~2 MB, so never import it from a 'use client' file.
import raw from '@/data/places';
import { slugify } from '@/lib/api/geocoding';

// [GeoNames id, name, country code, state code, latitude, longitude, population]
type Row = [number, string, string, string, number, number, number];
type PlacesFile = {
  countries: Record<string, { n: string; c: string; s: Record<string, string> }>;
  cities: Row[]; // sorted by population, largest first
};

export type PlaceCity = { id: number; name: string; cc: string; stateCode: string; lat: number; lon: number; population: number };
export type Country = { code: string; name: string; continent: string; cityCount: number };
export type State = { cc: string; code: string; name: string; slug: string; cityCount: number };

export const CONTINENTS: { code: string; name: string }[] = [
  { code: 'AS', name: 'Asia' }, { code: 'EU', name: 'Europe' }, { code: 'AF', name: 'Africa' },
  { code: 'NA', name: 'North America' }, { code: 'SA', name: 'South America' },
  { code: 'OC', name: 'Oceania' }, { code: 'AN', name: 'Antarctica' },
];

const toCity = (r: Row): PlaceCity => ({ id: r[0], name: r[1], cc: r[2], stateCode: r[3], lat: r[4], lon: r[5], population: r[6] });

type Index = {
  rows: Row[];
  countries: Map<string, Country>;
  byId: Map<number, Row>;
  byState: Map<string, Row[]>; // key "IN.10"
  byCountry: Map<string, Row[]>;
  states: Map<string, State[]>; // by country, sorted by name
  stateBySlug: Map<string, State>; // key "IN/haryana"
  stateByCode: Map<string, State>; // key "IN.10"
};

let cache: Index | null = null;

/** Parse the data once per server instance and build the lookups. */
function index(): Index {
  if (cache) return cache;
  const file = JSON.parse(raw) as PlacesFile;
  const byId = new Map<number, Row>();
  const byState = new Map<string, Row[]>();
  const byCountry = new Map<string, Row[]>();
  const push = (m: Map<string, Row[]>, k: string, r: Row) => {
    const list = m.get(k);
    if (list) list.push(r);
    else m.set(k, [r]);
  };
  for (const r of file.cities) {
    byId.set(r[0], r);
    push(byState, `${r[2]}.${r[3]}`, r);
    push(byCountry, r[2], r);
  }

  const countries = new Map<string, Country>();
  const states = new Map<string, State[]>();
  const stateBySlug = new Map<string, State>();
  const stateByCode = new Map<string, State>();
  for (const [cc, c] of Object.entries(file.countries)) {
    countries.set(cc, { code: cc, name: c.n, continent: c.c, cityCount: byCountry.get(cc)?.length ?? 0 });
    const used = new Set<string>();
    const list: State[] = [];
    for (const [code, name] of Object.entries(c.s)) {
      let slug = code === '_' ? 'other-places' : slugify(name);
      if (used.has(slug)) slug = `${slug}-${slugify(code)}`; // two regions with the same name
      used.add(slug);
      const st: State = { cc, code, name, slug, cityCount: byState.get(`${cc}.${code}`)?.length ?? 0 };
      list.push(st);
      stateBySlug.set(`${cc}/${slug}`, st);
      stateByCode.set(`${cc}.${code}`, st);
    }
    list.sort((a, b) => a.name.localeCompare(b.name, 'en'));
    states.set(cc, list);
  }
  cache = { rows: file.cities, countries, byId, byState, byCountry, states, stateBySlug, stateByCode };
  return cache;
}

export const countryHref = (cc: string) => `/country/${cc.toLowerCase()}`;
export const stateHref = (s: State) => `/country/${s.cc.toLowerCase()}/${s.slug}`;

export const getCountry = (code: string): Country | null => index().countries.get(code.toUpperCase()) ?? null;
export const listCountries = (): Country[] =>
  [...index().countries.values()].sort((a, b) => a.name.localeCompare(b.name, 'en'));
export const listStates = (cc: string): State[] => index().states.get(cc.toUpperCase()) ?? [];
export const listAllStates = (): State[] => [...index().states.values()].flat();
export const getStateBySlug = (cc: string, slug: string): State | null =>
  index().stateBySlug.get(`${cc.toUpperCase()}/${slug}`) ?? null;
export const getStateOf = (c: PlaceCity): State | null => index().stateByCode.get(`${c.cc}.${c.stateCode}`) ?? null;

export function getCityById(id: number): PlaceCity | null {
  const r = index().byId.get(id);
  return r ? toCity(r) : null;
}
/** Cities in a state, largest first. */
export const citiesInState = (cc: string, code: string): PlaceCity[] =>
  (index().byState.get(`${cc.toUpperCase()}.${code}`) ?? []).map(toCity);
/** The n largest cities in a country. */
export const topCitiesInCountry = (cc: string, n: number): PlaceCity[] =>
  (index().byCountry.get(cc.toUpperCase()) ?? []).slice(0, n).map(toCity);

// ---- sitemap: file 0 = home, countries and states; files 1..n = cities, 5,000 per file ----
export const SITEMAP_PER_FILE = 5000;
export const sitemapFileCount = () => 1 + Math.ceil(index().rows.length / SITEMAP_PER_FILE);
export const sitemapCities = (file: number): PlaceCity[] =>
  index().rows.slice((file - 1) * SITEMAP_PER_FILE, file * SITEMAP_PER_FILE).map(toCity);
