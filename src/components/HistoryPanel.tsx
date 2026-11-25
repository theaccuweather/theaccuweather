'use client';

// "Last 30 days" on city pages: daily temperature range and rain first, then daily US AQI.
// Loads only when the visitor asks for it.
import { useState } from 'react';
import { categorize } from '@/lib/aqi';

type Day = { date: string; max: number | null; min: number | null; rain: number | null; aqiAvg: number | null; aqiMax: number | null };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const label = (d: string) => `${Number(d.slice(8, 10))} ${MONTHS[Number(d.slice(5, 7)) - 1] ?? ''}`;
const W = 720, H = 150, GAP = 3;

export default function HistoryPanel({ lat, lon, name }: { lat: number; lon: number; name: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [days, setDays] = useState<Day[]>([]);
  const [message, setMessage] = useState('');

  const load = async () => {
    setState('loading');
    try {
      const res = await fetch(`/api/history?lat=${lat}&lon=${lon}`);
      const json = await res.json();
      if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error : 'History is unavailable right now.');
      setDays(Array.isArray(json.days) ? (json.days as Day[]) : []);
      setState('ready');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'History is unavailable right now.');
      setState('error');
    }
  };

  if (state !== 'ready') {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="min-w-0 flex-1 text-sm text-muted">
          {state === 'error' ? message : `Daily temperatures, rain and air quality in ${name} over the past month.`}
        </p>
        <button type="button" onClick={load} disabled={state === 'loading'}
          className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {state === 'loading' ? 'Loading…' : state === 'error' ? 'Try again' : 'Show the last 30 days'}
        </button>
      </div>
    );
  }
  if (days.length === 0) return <p className="text-sm text-muted">No history is available for this location.</p>;
  return (
    <div className="space-y-6">
      <TempChart days={days} />
      <AqiChart days={days} />
    </div>
  );
}

function Ticks({ days, bw }: { days: Day[]; bw: number }) {
  const idx = [...new Set([0, Math.floor(days.length / 2), days.length - 1])];
  return (
    <>
      {idx.map((i) => (
        <text key={i} x={i * (bw + GAP) + bw / 2} y={H + 14} fontSize="11" className="fill-muted"
          textAnchor={i === 0 ? 'start' : i === days.length - 1 ? 'end' : 'middle'}>
          {label(days[i].date)}
        </text>
      ))}
    </>
  );
}

function TempChart({ days }: { days: Day[] }) {
  const t = days.filter((d): d is Day & { max: number; min: number } => d.max != null && d.min != null);
  if (t.length === 0) return null;
  const hi = Math.max(...t.map((d) => d.max)) + 2;
  const lo = Math.min(...t.map((d) => d.min)) - 2;
  const bw = (W - GAP * (days.length - 1)) / days.length;
  const y = (v: number) => H - ((v - lo) / (hi - lo)) * H;
  const warm = t.reduce((a, b) => (b.max > a.max ? b : a));
  const cool = t.reduce((a, b) => (b.min < a.min ? b : a));
  const rainDays = days.filter((d) => (d.rain ?? 0) >= 1).length;
  const rain = days.reduce((s, d) => s + (d.rain ?? 0), 0);
  return (
    <div>
      <h3 className="text-sm font-semibold">Daily high and low temperature</h3>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="mt-2 h-44 w-full" preserveAspectRatio="none" role="img"
        aria-label={`Daily temperatures over the last ${days.length} days, from ${Math.round(cool.min)} to ${Math.round(warm.max)} degrees`}>
        {days.map((d, i) => (d.max == null || d.min == null ? null : (
          <rect key={d.date} x={i * (bw + GAP)} y={y(d.max)} width={bw} height={Math.max(2, y(d.min) - y(d.max))} rx="2" fill="#f59e0b">
            <title>{`${label(d.date)}: ${Math.round(d.max)}° / ${Math.round(d.min)}°`}</title>
          </rect>
        )))}
        <Ticks days={days} bw={bw} />
      </svg>
      <p className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span>Warmest: <b>{Math.round(warm.max)}°C</b> on {label(warm.date)}</span>
        <span>Coolest: <b>{Math.round(cool.min)}°C</b> on {label(cool.date)}</span>
        <span>Rain: <b>{rain.toFixed(0)} mm</b> on {rainDays} {rainDays === 1 ? 'day' : 'days'}</span>
      </p>
    </div>
  );
}

function AqiChart({ days }: { days: Day[] }) {
  const a = days.filter((d): d is Day & { aqiAvg: number } => d.aqiAvg != null);
  if (a.length === 0) return <p className="text-sm text-muted">Air quality history isn’t available for this location.</p>;
  const top = Math.max(60, ...a.map((d) => d.aqiAvg)) * 1.1;
  const bw = (W - GAP * (days.length - 1)) / days.length;
  const worst = a.reduce((x, y) => (y.aqiAvg > x.aqiAvg ? y : x));
  const best = a.reduce((x, y) => (y.aqiAvg < x.aqiAvg ? y : x));
  const avg = Math.round(a.reduce((s, d) => s + d.aqiAvg, 0) / a.length);
  const color = (v: number) => categorize('us', v)?.color ?? '#9ca3af';
  return (
    <div>
      <h3 className="text-sm font-semibold">Daily average air quality (US AQI)</h3>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="mt-2 h-44 w-full" preserveAspectRatio="none" role="img"
        aria-label={`Daily average US AQI over the last ${days.length} days, from ${best.aqiAvg} to ${worst.aqiAvg}`}>
        {days.map((d, i) => {
          if (d.aqiAvg == null) return null;
          const bh = Math.max(2, (d.aqiAvg / top) * H);
          return (
            <rect key={d.date} x={i * (bw + GAP)} y={H - bh} width={bw} height={bh} rx="2" fill={color(d.aqiAvg)}>
              <title>{`${label(d.date)}: average ${d.aqiAvg}${d.aqiMax != null ? `, peak ${d.aqiMax}` : ''}`}</title>
            </rect>
          );
        })}
        <Ticks days={days} bw={bw} />
      </svg>
      <p className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span>Average: <b style={{ color: color(avg) }}>{avg}</b></span>
        <span>Worst day: <b style={{ color: color(worst.aqiAvg) }}>{worst.aqiAvg}</b> on {label(worst.date)}</span>
        <span>Best day: <b style={{ color: color(best.aqiAvg) }}>{best.aqiAvg}</b> on {label(best.date)}</span>
      </p>
      <p className="mt-1 text-xs text-muted">Daily averages of hourly model data (CAMS via Open-Meteo).</p>
    </div>
  );
}
