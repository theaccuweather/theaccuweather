import Link from 'next/link';
import Section from './Section';
import ErrorPanel from './ErrorPanel';
import RankingTable from './RankingTable';
import { liveRanking, rankingFromDb, type Period, type Ranking } from '@/lib/rankings';

const TABS: { period: Period; label: string; href: string }[] = [
  { period: 'now', label: 'Right now', href: '/ranking' },
  { period: '24h', label: '24-hour average', href: '/ranking/24-hours' },
  { period: '30d', label: '30-day average', href: '/ranking/30-days' },
];
const TITLE: Record<Period, string> = {
  now: 'Most polluted cities in the world right now',
  '24h': 'Most polluted cities over the last 24 hours',
  '30d': 'Most polluted cities over the last 30 days',
};

const utc = (iso: string) =>
  `${new Date(iso).toLocaleString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })} UTC`;

function subtitle(period: Period, r: Ranking): string {
  const n = r.rows.length;
  if (r.source === 'live') return `Live US AQI for ${n} major cities · refreshed every hour`;
  if (period === 'now') return `US AQI for ${n} of the world's biggest cities${r.updated ? ` · updated ${utc(r.updated)}` : ''} · refreshed every 3 hours`;
  if (period === '24h') return `Average US AQI over the last 24 hours for ${n} cities`;
  return `Average US AQI over the last 30 days for ${n} cities${r.days < 30 ? ` · based on ${r.days} ${r.days === 1 ? 'day' : 'days'} collected so far` : ''}`;
}

export default async function RankingView({ period }: { period: Period }) {
  const ranking = (await rankingFromDb(period)) ?? (period === 'now' ? await liveRanking() : null);
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted"><Link href="/" className="hover:text-link">Home</Link> › Ranking</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{TITLE[period]}</h1>
        {ranking && <p className="text-sm text-muted">{subtitle(period, ranking)}</p>}
      </div>
      <nav aria-label="Ranking period" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link key={t.period} href={t.href} aria-current={t.period === period ? 'page' : undefined}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${t.period === period ? 'border-brand bg-brand text-white' : 'border-line hover:border-link hover:text-link'}`}>
            {t.label}
          </Link>
        ))}
      </nav>
      {ranking ? (
        <Section><RankingTable rows={ranking.rows} /></Section>
      ) : period === 'now' ? (
        <ErrorPanel title="The ranking is unavailable right now" detail="Please refresh in a few minutes." />
      ) : (
        <ErrorPanel title="Not enough history yet"
          detail="Averages appear once the 3-hourly data collection has been running for a while. The 30-day ranking fills in over the first month." />
      )}
    </div>
  );
}
