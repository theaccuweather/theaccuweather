import { categorize } from '@/lib/aqi';
import type { AirQuality } from '@/lib/api/airQuality';

/** Six pollutant cards; the coloured bottom edge shows each one's US AQI level. */
export default function PollutantGrid({ pollutants }: { pollutants: AirQuality['pollutants'] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
      {pollutants.map((p) => {
        const cat = categorize('us', p.usSub);
        return (
          <div key={p.key} className="rounded-xl border border-line border-b-4 p-3" style={{ borderBottomColor: cat?.color ?? 'rgb(var(--taw-line))' }}>
            <p className="text-xs text-muted">{p.label}</p>
            <p className="text-xl font-semibold tabular-nums">{p.value ?? '\u2014'}</p>
            <p className="text-xs text-muted">{p.unit}</p>
          </div>
        );
      })}
    </div>
  );
}
