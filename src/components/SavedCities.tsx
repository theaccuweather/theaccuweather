'use client';

// "Your saved places" on the home page (cities saved with the heart button). Hidden when empty.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Section from './Section';
import { readSaved, SAVED_EVENT, type SavedCity } from '@/lib/saved';

export default function SavedCities() {
  const [list, setList] = useState<SavedCity[]>([]);
  useEffect(() => {
    const sync = () => setList(readSaved());
    sync();
    window.addEventListener(SAVED_EVENT, sync);
    return () => window.removeEventListener(SAVED_EVENT, sync);
  }, []);
  if (list.length === 0) return null;
  return (
    <Section title="Your saved places">
      <div className="flex flex-wrap gap-2">
        {list.map((c) => (
          <Link key={c.href} href={c.href} className="rounded-full border border-line px-3 py-1.5 text-sm hover:border-link hover:text-link">
            {c.name}{c.region && <span className="text-muted">, {c.region}</span>}
          </Link>
        ))}
      </div>
    </Section>
  );
}
