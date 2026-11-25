import { SITE } from '@/lib/site';
import { sitemapFileCount } from '@/lib/places';

export const dynamic = 'force-static';

// One address that lists every sitemap file. Submit this in Google Search Console.
export function GET() {
  const files = Array.from({ length: sitemapFileCount() }, (_, i) => `  <sitemap><loc>${SITE.url}/sitemap/${i}.xml</loc></sitemap>`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${files.join('\n')}\n</sitemapindex>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
