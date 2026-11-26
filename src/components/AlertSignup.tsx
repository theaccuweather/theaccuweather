'use client';

// "Get alerts" form on city pages: rain/storm heads-up (weather first) and an AQI limit.
import { useState } from 'react';
import Link from 'next/link';

type Props = { name: string; href: string; lat: number; lon: number };

export default function AlertSignup({ name, href, lat, lon }: Props) {
  const [email, setEmail] = useState('');
  const [weather, setWeather] = useState(true);
  const [aqi, setAqi] = useState('150');
  const [website, setWebsite] = useState(''); // hidden from people; bots fill it in
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const submit = async () => {
    setState('busy');
    try {
      const res = await fetch('/api/alerts/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, href, lat, lon, weather, aqi: aqi === 'off' ? null : Number(aqi), website }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Something went wrong.');
      setMsg(json.message); setState('done');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Something went wrong.'); setState('error');
    }
  };

  if (state === 'done') return <p role="status" className="text-sm">{msg}</p>;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Get an email when rain or storms are on the way in {name}, or when the air gets unhealthy. At most one email a day.</p>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={weather} onChange={(e) => setWeather(e.target.checked)} className="h-4 w-4 accent-brand" />
          Rain and storms in the next 24 hours
        </label>
        <label className="flex items-center gap-2">
          Air quality alert
          <select value={aqi} onChange={(e) => setAqi(e.target.value)} className="rounded-lg border border-line bg-page px-2 py-1 text-ink">
            <option value="100">US AQI 100+ (sensitive groups)</option>
            <option value="150">US AQI 150+ (unhealthy)</option>
            <option value="200">US AQI 200+ (very unhealthy)</option>
            <option value="off">Off</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <label htmlFor="alert-email" className="sr-only">Email address</label>
        <input id="alert-email" type="email" autoComplete="email" placeholder="you@example.com" value={email}
          onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          className="min-w-0 flex-1 rounded-full border border-line bg-page px-4 py-2 text-sm outline-none focus:border-link" />
        <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} className="hidden" />
        <button type="button" onClick={submit} disabled={state === 'busy' || !email || (!weather && aqi === 'off')}
          className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white disabled:opacity-60">
          {state === 'busy' ? 'Sending…' : 'Get alerts'}
        </button>
      </div>
      {state === 'error' && <p role="alert" className="text-sm text-red-500">{msg}</p>}
      <p className="text-xs text-muted">We only use your email for these alerts. <Link href="/privacy" className="text-link hover:underline">Privacy</Link></p>
    </div>
  );
}
