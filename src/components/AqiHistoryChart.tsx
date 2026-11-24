import { categorize } from '@/lib/aqi';
import { hourLabel } from '@/lib/format';

/** 24-hour US AQI bar chart drawn as plain SVG (no chart library needed). */
export default function AqiHistoryChart({ history }: { history: { time: string; aqi: number | null }[] }) {
  const valid = history.filter((h): h is { time: string; aqi: number } => h.aqi != null);
  if (valid.length === 0) return <p className="text-sm text-muted">No recent AQI history for this location.</p>;

  const W = 720, H = 170, gap = 3;
  const top = Math.max(60, ...valid.map((h) => h.aqi)) * 1.1;
  const bw = (W - gap * (history.length - 1)) / history.length;
  const min = valid.reduce((a, b) => (b.aqi < a.aqi ? b : a));
  const max = valid.reduce((a, b) => (b.aqi > a.aqi ? b : a));
  const ticks = [0, Math.floor(history.length / 2), history.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="h-48 w-full" role="img"
        aria-label={`US AQI over the last 24 hours, from ${min.aqi} to ${max.aqi}`} preserveAspectRatio="none">
        <line x1="0" x2={W} y1={H} y2={H} stroke="#e3e7ef" />
        {history.map((h, i) => {
          if (h.aqi == null) return null;
          const bh = Math.max(2, (h.aqi / top) * H);
          return (
            <rect key={h.time} x={i * (bw + gap)} y={H - bh} width={bw} height={bh} rx="2" fill={categorize('us', h.aqi)!.color}>
              <title>{`${hourLabel(h.time)}: AQI ${h.aqi}`}</title>
            </rect>
          );
        })}
        {ticks.map((i) => history[i] && (
          <text key={i} x={i * (bw + gap) + bw / 2} y={H + 14} fontSize="11" fill="#5b6475"
            textAnchor={i === 0 ? 'start' : i === history.length - 1 ? 'end' : 'middle'}>
            {hourLabel(history[i].time)}
          </text>
        ))}
      </svg>
      <p className="mt-2 flex flex-wrap gap-x-6 text-sm">
        <span>Min AQI (US): <b style={{ color: categorize('us', min.aqi)!.color }}>{min.aqi}</b> at {hourLabel(min.time)}</span>
        <span>Max AQI (US): <b style={{ color: categorize('us', max.aqi)!.color }}>{max.aqi}</b> at {hourLabel(max.time)}</span>
      </p>
    </div>
  );
}
