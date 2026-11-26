'use client';

// A single button that confirms or cancels alerts. A button (not an automatic action on page
// load) so email security scanners that open links can't confirm or unsubscribe by accident.
import { useState } from 'react';
import Link from 'next/link';

type Props = { token: string; action: 'confirm' | 'unsubscribe' };

export default function TokenAction({ token, action }: Props) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const run = async () => {
    setState('busy');
    try {
      const res = await fetch(`/api/alerts/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Something went wrong.');
      setMsg(action === 'confirm' ? `Alerts for ${json.place} are on. We'll email you at most once a day.` : 'You’re unsubscribed and your email address has been deleted.');
      setState('done');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Something went wrong.');
      setState('error');
    }
  };
  if (state === 'done' || state === 'error') {
    return (
      <div role="status" className="space-y-3">
        <p className="text-sm">{msg}</p>
        <Link href="/" className="inline-block text-sm font-medium text-link hover:underline">Go to the home page</Link>
      </div>
    );
  }
  return (
    <button type="button" onClick={run} disabled={state === 'busy'} className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white disabled:opacity-60">
      {state === 'busy' ? 'Working…' : action === 'confirm' ? 'Confirm my alerts' : 'Unsubscribe and delete my email'}
    </button>
  );
}
