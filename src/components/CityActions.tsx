'use client';

// The three buttons at the top right of the AQI card: Locate me, Save (heart), Share.
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';
import { readSaved, SAVED_EVENT, toggleSaved } from '@/lib/saved';

const round = 'grid h-11 w-11 place-items-center rounded-full border border-line text-ink hover:border-link hover:text-link';

export function LocateButton() {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'busy' | 'blocked'>('idle');
  const locate = () => {
    if (!navigator.geolocation) { setState('blocked'); return; }
    setState('busy');
    navigator.geolocation.getCurrentPosition(
      (p) => { setState('idle'); router.push(`/here?lat=${p.coords.latitude.toFixed(3)}&lon=${p.coords.longitude.toFixed(3)}`); },
      () => setState('blocked'),
      { timeout: 10000, maximumAge: 600000 },
    );
  };
  return (
    <button type="button" onClick={locate} disabled={state === 'busy'}
      title={state === 'blocked' ? 'Location access is blocked in your browser settings' : undefined}
      className="flex h-11 items-center gap-2 rounded-xl border border-link px-4 text-sm font-medium text-link hover:bg-link/10 disabled:opacity-60">
      <Icon name="location" />
      {state === 'busy' ? 'Locating…' : state === 'blocked' ? 'Location blocked' : 'Locate me'}
    </button>
  );
}

export function FavoriteButton({ name, region, href }: { name: string; region: string; href?: string }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const target = href ?? `${window.location.pathname}${window.location.search}`;
    const sync = () => setSaved(readSaved().some((c) => c.href === target));
    sync();
    window.addEventListener(SAVED_EVENT, sync);
    return () => window.removeEventListener(SAVED_EVENT, sync);
  }, [href]);
  const toggle = () => {
    const target = href ?? `${window.location.pathname}${window.location.search}`;
    setSaved(toggleSaved({ name, region, href: target }));
  };
  return (
    <button type="button" onClick={toggle} aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from saved places` : `Save ${name}`}
      className={`${round} ${saved ? 'text-rose-500' : ''}`}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor"
        strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20.5s-7.6-4.6-9.4-9.3C1.3 7.8 3.4 4.5 6.8 4.5c2 0 3.4 1.1 4.2 2.4.8-1.3 2.2-2.4 4.2-2.4 3.4 0 5.5 3.3 4.2 6.7C17.6 15.9 12 20.5 12 20.5z" />
      </svg>
    </button>
  );
}

export function ShareButton() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const share = async () => {
    const url = window.location.href;
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ title: document.title, url }); } catch { /* the visitor closed the share sheet */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard not allowed */ }
  };
  return (
    <div className="relative">
      <button type="button" onClick={share} aria-label="Share this page" className={round}>
        <Icon name="share" />
      </button>
      <span role="status" hidden={!copied}
        className="absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded-md bg-raised px-2 py-1 text-xs text-ink">
        Link copied
      </span>
    </div>
  );
}
