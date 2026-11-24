// Sunrise and sunset worked out on our side (the standard "sunrise equation"),
// so we don't spend Open-Meteo variables on them. Accurate to a minute or two.
const RAD = Math.PI / 180;

export type SunDay = { sunrise: string; sunset: string; polar: 'day' | 'night' | null };

/** Local sunrise/sunset ("2026-11-25T06:51") for a date, place and UTC offset. */
export function sunTimes(date: string, lat: number, lon: number, utcOffsetSeconds: number): SunDay {
  const [y, m, d] = date.split('-').map(Number);
  const jdNoon = Date.UTC(y, m - 1, d, 12) / 86_400_000 + 2_440_587.5;
  const jStar = Math.round(jdNoon - 2_451_545.0) - lon / 360; // mean solar noon
  const M = (((357.5291 + 0.98560028 * jStar) % 360) + 360) % 360; // solar mean anomaly
  const C = 1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD);
  const lambda = (M + C + 180 + 102.9372) % 360; // ecliptic longitude
  const jTransit = 2_451_545.0 + jStar + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * lambda * RAD);
  const sinDec = Math.sin(lambda * RAD) * Math.sin(23.4397 * RAD);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosW = (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * sinDec) / (Math.cos(lat * RAD) * cosDec);
  if (cosW < -1) return { sunrise: '', sunset: '', polar: 'day' }; // midnight sun
  if (cosW > 1) return { sunrise: '', sunset: '', polar: 'night' }; // polar night
  const w = Math.acos(cosW) / RAD;
  const toLocal = (jd: number) =>
    new Date((jd - 2_440_587.5) * 86_400_000 + utcOffsetSeconds * 1000).toISOString().slice(0, 16);
  return { sunrise: toLocal(jTransit - w / 360), sunset: toLocal(jTransit + w / 360), polar: null };
}

/** Is the sun up at a local time like "2026-11-25T14:00"? */
export function isDaytime(time: string, sun: SunDay | undefined): boolean {
  if (!sun) return true;
  if (sun.polar) return sun.polar === 'day';
  return time >= sun.sunrise && time < sun.sunset;
}
