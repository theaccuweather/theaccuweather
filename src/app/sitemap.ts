import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';
import { POPULAR_CITIES } from '@/lib/cities';
import { cityHref } from '@/lib/api/geocoding';

// Phase 2 expands this to ~30,000 city pages.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE.url, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE.url}/ranking`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${SITE.url}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    ...POPULAR_CITIES.map((c) => ({ url: `${SITE.url}${cityHref(c)}`, lastModified: now, changeFrequency: 'hourly' as const, priority: 0.7 })),
  ];
}
