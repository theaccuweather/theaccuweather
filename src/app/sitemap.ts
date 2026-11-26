import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';
import { cityHref } from '@/lib/api/geocoding';
import { countryHref, listAllStates, listCountries, sitemapCities, sitemapFileCount, stateHref } from '@/lib/places';

// Split into files: /sitemap/0.xml (home, countries, states) and /sitemap/1.xml … (5,000 cities each).
// /sitemap-index.xml lists them all; that's the one address to give Google Search Console.
export async function generateSitemaps() {
  return Array.from({ length: sitemapFileCount() }, (_, id) => ({ id }));
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const file = Number(id);
  if (file === 0) {
    return [
      { url: SITE.url, changeFrequency: 'hourly', priority: 1 },
      { url: `${SITE.url}/ranking`, changeFrequency: 'hourly', priority: 0.8 },
      { url: `${SITE.url}/ranking/24-hours`, changeFrequency: 'hourly', priority: 0.6 },
      { url: `${SITE.url}/ranking/30-days`, changeFrequency: 'daily', priority: 0.6 },
      { url: `${SITE.url}/map`, changeFrequency: 'hourly', priority: 0.6 },
      { url: `${SITE.url}/country`, changeFrequency: 'monthly', priority: 0.6 },
      { url: `${SITE.url}/about`, changeFrequency: 'monthly', priority: 0.3 },
      { url: `${SITE.url}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
      ...listCountries().map((c) => ({ url: `${SITE.url}${countryHref(c.code)}`, priority: 0.6 })),
      ...listAllStates().map((s) => ({ url: `${SITE.url}${stateHref(s)}`, priority: 0.5 })),
    ];
  }
  return sitemapCities(file).map((c) => ({ url: `${SITE.url}${cityHref(c)}` }));
}
