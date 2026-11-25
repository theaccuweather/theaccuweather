import Link from 'next/link';
import { SITE } from '@/lib/site';

export type Crumb = { name: string; href?: string };

/** "Home › India › Haryana › Hisar", plus the matching structured data for Google. */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ name: 'Home', href: '/' }, ...items];
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all
      .filter((c) => c.href)
      .map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: `${SITE.url}${c.href === '/' ? '' : c.href}` })),
  };
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <li key={`${c.name}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true">›</span>}
              {c.href && !last
                ? <Link href={c.href} className="hover:text-link">{c.name}</Link>
                : <span aria-current={last ? 'page' : undefined} className={last ? 'text-ink' : ''}>{c.name}</span>}
            </li>
          );
        })}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
    </nav>
  );
}
