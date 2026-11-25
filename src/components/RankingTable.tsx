'use client';

// Ranking table with a Most polluted / Cleanest switch.
import Link from 'next/link';
import { useState } from 'react';
import Icon from './Icon';
import { categorize, textOn } from '@/lib/aqi';
import { describeWeather } from '@/lib/weatherCodes';
import type { RankRow } from '@/lib/rankings';

export default function RankingTable({ rows }: { rows: RankRow[] }) {
  const [order, setOrder] = useState<'most' | 'least'>('most');
  const list = order === 'most' ? rows : [...rows].reverse();
  return (
    <div>
      <div role="group" aria-label="Sort order" className="mb-3 inline-flex overflow-hidden rounded-full border border-line text-sm">
        {(['most', 'least'] as const).map((o) => (
          <button key={o} type="button" aria-pressed={order === o} onClick={() => setOrder(o)}
            className={`px-4 py-1.5 font-medium ${order === o ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}>
            {o === 'most' ? 'Most polluted' : 'Cleanest'}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line bg-page text-left text-muted">
              <th className="px-3 py-2 text-right font-medium">Rank</th>
              <th className="px-3 py-2 font-medium">City</th>
              <th className="px-3 py-2 font-medium">Country</th>
              <th className="px-3 py-2 font-medium">Weather</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 text-right font-medium">US AQI</th>
              <th className="px-3 py-2 text-right font-medium">PM2.5 (µg/m³)</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r, i) => {
              const cat = categorize('us', r.aqi);
              const w = r.code != null ? describeWeather(r.code) : null;
              return (
                <tr key={r.id} className="border-b border-line hover:bg-page">
                  <td className="px-3 py-2 text-right tabular-nums">{i + 1}</td>
                  <td className="px-3 py-2"><Link href={r.href} className="font-medium hover:text-link">{r.name}</Link></td>
                  <td className="px-3 py-2 text-muted">{r.country}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {w && <Icon name={w.icon} className="mr-1.5" label={w.label} />}
                    {r.temp == null ? <span className="text-muted">—</span> : `${Math.round(r.temp)}°C`}
                  </td>
                  <td className="px-3 py-2">
                    {cat && <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: cat.color, color: textOn(cat.color) }}>{cat.label}</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{r.aqi ?? '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.pm25 ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
