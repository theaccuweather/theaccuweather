'use client';

/*
 * City search with live suggestions (debounced), keyboard navigation and a
 * "use my location" button. Suggestions come from our /api/search route.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';

type Result = { id: number; name: string; admin1?: string; country?: string; href: string };

export default function SearchBox({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'empty'>('idle');
  const [message, setMessage] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounce: wait 300 ms after typing stops, cancel older requests.
  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) { setResults([]); setStatus('idle'); return; }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setStatus('loading');
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: ctrl.signal });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Search failed');
        setResults(data.results);
        setStatus(data.results.length ? 'idle' : 'empty');
        setActive(-1);
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        setStatus('error');
        setMessage((e as Error).message);
      }
    }, 300);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [q]);

  // Close the list when clicking elsewhere.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const go = (r: Result) => { setOpen(false); setQ(''); router.push(r.href); };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(results.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Enter') { const r = results[active >= 0 ? active : 0]; if (r) go(r); }
    else if (e.key === 'Escape') setOpen(false);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) { setStatus('error'); setMessage('Your browser cannot share its location.'); setOpen(true); return; }
    setStatus('loading'); setMessage('');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setStatus('idle'); router.push(`/here?lat=${pos.coords.latitude.toFixed(3)}&lon=${pos.coords.longitude.toFixed(3)}`); },
      () => { setStatus('error'); setMessage('Location access was blocked. Search for a city instead.'); setOpen(true); },
      { timeout: 10000, maximumAge: 600000 },
    );
  };

  const pad = size === 'lg' ? 'py-3 text-base' : 'py-2 text-sm';
  const showList = open && (results.length > 0 || status === 'empty' || status === 'error');

  return (
    <div ref={boxRef} className="relative">
      <label htmlFor={`${listId}-input`} className="sr-only">Search any city</label>
      <div className="flex items-center rounded-full border border-line bg-page focus-within:border-brand">
        <Icon name="search" className="ml-4 text-muted" />
        <input
          id={`${listId}-input`}
          type="search"
          autoComplete="off"
          placeholder="Search any city, state or country"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${listId}-list`}
          aria-activedescendant={active >= 0 ? `${listId}-opt-${active}` : undefined}
          className={`min-w-0 flex-1 bg-transparent px-3 outline-none placeholder:text-muted ${pad}`}
        />
        {status === 'loading' && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-label="Loading" />}
        <button type="button" onClick={useMyLocation} title="Use my location" className="mr-1.5 rounded-full p-2 text-brand hover:bg-white">
          <Icon name="location" label="Use my location" />
        </button>
      </div>
      {showList && (
        <ul id={`${listId}-list`} role="listbox" className="absolute left-0 right-0 z-40 mt-1 overflow-hidden rounded-xl border border-line bg-white shadow-lg">
          {status === 'error' && <li className="px-4 py-3 text-sm text-red-700">{message}</li>}
          {status === 'empty' && <li className="px-4 py-3 text-sm text-muted">No places match &ldquo;{q}&rdquo;.</li>}
          {results.map((r, i) => (
            <li
              key={r.id}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); go(r); }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-4 py-2.5 text-sm ${i === active ? 'bg-page' : ''}`}
            >
              <span className="font-medium">{r.name}</span>
              <span className="text-muted">{[r.admin1, r.country].filter(Boolean).map((s) => `, ${s}`).join('')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
