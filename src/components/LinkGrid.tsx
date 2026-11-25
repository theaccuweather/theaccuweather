import Link from 'next/link';

export type GridLink = { name: string; href: string; note?: string };

/** A compact multi-column list of links (countries, states, cities). */
export default function LinkGrid({ links }: { links: GridLink[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3 lg:grid-cols-4">
      {links.map((l) => (
        <li key={l.href} className="min-w-0">
          <Link href={l.href} className="block truncate hover:text-link" title={l.name}>
            {l.name}
            {l.note && <span className="text-muted"> · {l.note}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
