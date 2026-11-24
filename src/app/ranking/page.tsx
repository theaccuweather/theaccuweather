import type { Metadata } from 'next';
import Link from 'next/link';
import Section from '@/components/Section';
import ErrorPanel from '@/components/ErrorPanel';
import { POPULAR_CITIES } from '@/lib/cities';
import { getAqiMany } from '@/lib/api/airQuality';
import { getWeatherMany } from '@/lib/api/forecast';
import { isBuildPhase, isRateLimit } from '@/lib/api/client';
import { cityHref } from '@/lib/api/geocoding';
import { categorize, textOn } from '@/lib/aqi';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Most polluted major cities in the world right now',
  description: 'Live US AQI ranking of major world cities, from most to least polluted.',
};

export default async function RankingPage() {
  const [aqi, wx] = await Promise.allSettled([getAqiMany(POPULAR_CITIES), getWeatherMany(POPULAR_CITIES)]);
  // Keep the last good page live if the provider fails (except during `next build`).
  if (!isBuildPhase()) {
    if (aqi.status === 'rejected') throw aqi.reason;
    if (wx.status === 'rejected' && isRateLimit(wx.reason)) throw wx.reason;
  }
  if (aqi.status === 'rejected') {
    return <ErrorPanel title="The ranking is unavailable right now" detail="Please refresh in a few minutes." />;
  }
  const rows = POPULAR_CITIES.map((c, i) => ({
    ...c,
    aqi: aqi.value[i]?.aqi ?? null,
    pm25: aqi.value[i]?.pm25 ?? null,
    temp: wx.status === 'fulfilled' ? wx.value[i]?.temp ?? null : null,
  }))
    .filter((r) => r.aqi != null)
    .sort((a, b) => (b.aqi ?? 0) - (a.aqi ?? 0));

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted"><Link href="/" className="hover:text-brand">Home</Link> &rsaquo; Ranking</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Most polluted major cities right now</h1>
        <p className="text-sm text-muted">Live US AQI for {rows.length} major cities &middot; refreshed every hour</p>
      </div>
      <Section>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-line bg-page text-left text-muted">
                <th className="px-3 py-2 text-right font-medium">Rank</th>
                <th className="px-3 py-2 font-medium">City</th>
                <th className="px-3 py-2 font-medium">Country</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">US AQI</th>
                <th className="px-3 py-2 text-right font-medium">PM2.5 (&micro;g/m&sup3;)</th>
                <th className="px-3 py-2 text-right font-medium">Temp</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const cat = categorize('us', r.aqi)!;
                return (
                  <tr key={r.id} className="border-b border-line hover:bg-page">
                    <td className="px-3 py-2 text-right tabular-nums">{i + 1}</td>
                    <td className="px-3 py-2"><Link href={cityHref(r)} className="font-medium hover:text-brand">{r.name}</Link></td>
                    <td className="px-3 py-2 text-muted">{r.country}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: cat.color, color: textOn(cat.color) }}>{cat.label}</span>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">{r.aqi}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.pm25 ?? '\u2014'}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.temp == null ? '\u2014' : `${Math.round(r.temp)}\u00b0`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
