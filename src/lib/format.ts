// Formatting helpers. API times are already in the location's local time
// ("2026-11-25T13:00"), so we read them as text instead of converting time zones.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const dash = (v: number | null | undefined, suffix = '', digits = 0) =>
  v == null ? '\u2014' : `${v.toFixed(digits)}${suffix}`;

/** "2026-11-25T13:00" -> "1 pm" */
export function hourLabel(t: string): string {
  const h = Number(t.slice(11, 13));
  if (Number.isNaN(h)) return '';
  const suffix = h < 12 ? 'am' : 'pm';
  return `${h % 12 === 0 ? 12 : h % 12} ${suffix}`;
}

/** "2026-11-25T06:51" -> "6:51 am" */
export function clockLabel(t: string): string {
  const h = Number(t.slice(11, 13));
  const m = t.slice(14, 16);
  if (Number.isNaN(h) || !m) return '\u2014';
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? 'am' : 'pm'}`;
}

/** "2026-11-25" -> "Wed 25" (or "Today" for the first day) */
export function dayLabel(date: string, index: number): string {
  if (index === 0) return 'Today';
  const d = new Date(`${date}T12:00:00Z`);
  return `${d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' })} ${d.getUTCDate()}`;
}

/** "2026-11-25T00:15" -> "25 Nov 2026, 12:15 am" */
export function updatedLabel(t: string): string {
  const [y, mo, d] = [t.slice(0, 4), Number(t.slice(5, 7)), Number(t.slice(8, 10))];
  if (!y || !mo) return '';
  return `${d} ${MONTHS[mo - 1]} ${y}, ${clockLabel(t)}`;
}
