import Icon from './Icon';
import { categorize, textOn } from '@/lib/aqi';
import { describeWeather } from '@/lib/weatherCodes';
import { dayLabel } from '@/lib/format';
import type { Forecast } from '@/lib/api/forecast';

/** 7-day table: sky, high/low, rain and the day's peak AQI forecast (where available). */
export default function DailyForecast({ days, aqiByDay }: { days: Forecast['daily']; aqiByDay: Record<string, number> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-muted">
            <th className="py-2 pr-3 font-medium">Day</th>
            <th className="py-2 pr-3 font-medium">Sky</th>
            <th className="py-2 pr-3 text-right font-medium">High / low</th>
            <th className="py-2 pr-3 text-right font-medium">Rain</th>
            <th className="py-2 text-right font-medium">Peak AQI (US)</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d, i) => {
            const w = describeWeather(d.code);
            const aqi = aqiByDay[d.date];
            const cat = categorize('us', aqi ?? null);
            return (
              <tr key={d.date} className="border-b border-line last:border-0">
                <td className="py-2.5 pr-3 font-medium">{dayLabel(d.date, i)}</td>
                <td className="py-2.5 pr-3"><Icon name={w.icon} className="mr-2" />{w.label}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">
                  <b>{d.max == null ? '\u2014' : Math.round(d.max)}&deg;</b> / <span className="text-muted">{d.min == null ? '\u2014' : Math.round(d.min)}&deg;</span>
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{d.precip == null ? '\u2014' : `${d.precip.toFixed(1)} mm`}</td>
                <td className="py-2.5 text-right">
                  {cat ? (
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums" style={{ background: cat.color, color: textOn(cat.color) }}>{aqi}</span>
                  ) : <span className="text-xs text-muted">Not yet forecast</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
