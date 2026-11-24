import Icon from './Icon';
import { describeWeather } from '@/lib/weatherCodes';
import { hourLabel } from '@/lib/format';
import type { Forecast } from '@/lib/api/forecast';

/** Horizontally scrollable next-24-hours strip. */
export default function HourlyStrip({ hours }: { hours: Forecast['hourly'] }) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {hours.map((h, i) => {
        const w = describeWeather(h.code, h.isDay);
        return (
          <div key={h.time} className="flex w-[72px] shrink-0 flex-col items-center gap-1 rounded-xl border border-line py-2.5 text-xs">
            <span className="text-muted">{i === 0 ? 'Now' : hourLabel(h.time)}</span>
            <Icon name={w.icon} className="text-xl" label={w.label} />
            <span className="text-base font-semibold">{h.temp == null ? '\u2014' : `${Math.round(h.temp)}\u00b0`}</span>
            <span className="text-muted"><Icon name="droplet" className="mr-0.5" />{h.pop ?? 0}%</span>
          </div>
        );
      })}
    </div>
  );
}
