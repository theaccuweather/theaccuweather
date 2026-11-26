import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

// Search engines are welcome. Bulk scrapers and AI-training crawlers are not: they fetch all
// 31,799 city pages, and every page they trigger costs Vercel ISR writes and weather API calls.
const BLOCKED = [
  'GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'CCBot', 'ClaudeBot', 'anthropic-ai', 'Claude-Web',
  'Google-Extended', 'Applebot-Extended', 'Bytespider', 'Amazonbot', 'meta-externalagent',
  'FacebookBot', 'PerplexityBot', 'Diffbot', 'ImagesiftBot', 'Omgilibot', 'cohere-ai',
  'AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot', 'BLEXBot', 'PetalBot', 'DataForSeoBot', 'serpstatbot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: BLOCKED, disallow: '/' },
      { userAgent: '*', allow: '/', disallow: ['/api/', '/here', '/alerts/'] },
    ],
    sitemap: `${SITE.url}/sitemap-index.xml`,
  };
}
