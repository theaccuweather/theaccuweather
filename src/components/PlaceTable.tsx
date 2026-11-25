import Link from 'next/link';
import Icon from './Icon';
import { categorize, textOn } from '@/lib/aqi';
import { describeWeather } from '@/lib/weatherCodes';
import type { Live } from '@/lib/live';

export type PlaceRow = { id: number; name: string; href: string; sub?: string; live: Live | null };

/** Cities with their current weather first, then US AQI. */
export default function PlaceTable({ rows }: { rows: PlaceRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-muted">
            <th className="py-2 pr-3 font-medium">City</th>
            <th className="py-2 pr-3 font-medium">Weather</th>
            <th className="py-2 pr-3 text-right font-medium">Temp</th>
            <th className="py-2 text-right font-medium">AQI (US)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const w = r.live && r.live.code != null ? describeWeather(r.live.code, r.live.isDay) : null;
            const aqi = r.live?.aqi ?? null;
            const cat = categorize('us', aqi);
            return (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="py-2.5 pr-3">
                  <Link href={r.href} className="font-medium hover:text-link">{r.name}</Link>
                  {r.sub && <span className="block text-xs text-muted">{r.sub}</span>}
                </td>
                <td className="py-2.5 pr-3">{w ? <><Icon name={w.icon} className="mr-2" />{w.label}</> : <span className="text-muted">—</span>}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{r.live?.temp == null ? '—' : `${Math.round(r.live.temp)}°C`}</td>
                <td className="py-2.5 text-right">
                  {cat && aqi != null
                    ? <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums" style={{ background: cat.color, color: textOn(cat.color) }}>{aqi}</span>
                    : <span className="text-xs text-muted">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
