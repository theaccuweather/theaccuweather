'use client';

// "AQI standard" picker in the header. Every AQI card on the page follows it.
import { SCALES, type ScaleId } from '@/lib/aqi';
import { useScale } from '@/lib/useScale';

const NAMES: Record<ScaleId, string> = { us: 'US AQI', in: 'India AQI', eu: 'EU AQI' };

export default function ScaleSelect() {
  const [scale, choose] = useScale();
  return (
    <label className="flex flex-col text-[11px] leading-tight text-muted">
      <span className="hidden sm:block">AQI standard</span>
      <select value={scale} onChange={(e) => choose(e.target.value as ScaleId)} aria-label="AQI standard"
        className="mt-0.5 rounded-lg border border-line bg-page px-2 py-1.5 text-sm font-medium text-ink outline-none focus:border-link">
        {(Object.keys(SCALES) as ScaleId[]).map((s) => <option key={s} value={s}>{NAMES[s]}</option>)}
      </select>
    </label>
  );
}
