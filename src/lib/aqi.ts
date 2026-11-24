// AQI scales, colours and the India (CPCB) AQI calculation.
// Open-Meteo already returns US AQI and European AQI. India's AQI we compute ourselves.

export type ScaleId = 'us' | 'in' | 'eu';
export type Category = { label: string; color: string; max: number; level: number };

export const POLLUTANTS = ['pm2_5', 'pm10', 'nitrogen_dioxide', 'ozone', 'sulphur_dioxide', 'carbon_monoxide'] as const;
export type PollutantKey = (typeof POLLUTANTS)[number];
export const POLLUTANT_LABEL: Record<PollutantKey, string> = {
  pm2_5: 'PM2.5', pm10: 'PM10', nitrogen_dioxide: 'NO\u2082', ozone: 'O\u2083', sulphur_dioxide: 'SO\u2082', carbon_monoxide: 'CO',
};

// `level` 0-5 is a shared severity used for health advice and colours across scales.
export const SCALES: Record<ScaleId, { name: string; short: string; cats: Category[] }> = {
  us: {
    name: 'US AQI', short: 'US',
    cats: [
      { label: 'Good', color: '#59b61f', max: 50, level: 0 },
      { label: 'Moderate', color: '#eec732', max: 100, level: 1 },
      { label: 'Unhealthy for sensitive groups', color: '#ea8c34', max: 150, level: 2 },
      { label: 'Unhealthy', color: '#e95478', max: 200, level: 3 },
      { label: 'Very unhealthy', color: '#b33fba', max: 300, level: 4 },
      { label: 'Hazardous', color: '#c92033', max: Infinity, level: 5 },
    ],
  },
  in: {
    name: 'India AQI (CPCB)', short: 'IN',
    cats: [
      { label: 'Good', color: '#59b61f', max: 50, level: 0 },
      { label: 'Satisfactory', color: '#a3c853', max: 100, level: 1 },
      { label: 'Moderate', color: '#eec732', max: 200, level: 2 },
      { label: 'Poor', color: '#ea8c34', max: 300, level: 3 },
      { label: 'Very poor', color: '#e93f33', max: 400, level: 4 },
      { label: 'Severe', color: '#af2d24', max: Infinity, level: 5 },
    ],
  },
  eu: {
    name: 'European AQI', short: 'EU',
    cats: [
      { label: 'Good', color: '#50f0e6', max: 20, level: 0 },
      { label: 'Fair', color: '#50ccaa', max: 40, level: 1 },
      { label: 'Moderate', color: '#f0e641', max: 60, level: 2 },
      { label: 'Poor', color: '#ff5050', max: 80, level: 3 },
      { label: 'Very poor', color: '#960032', max: 100, level: 4 },
      { label: 'Extremely poor', color: '#7d2181', max: Infinity, level: 5 },
    ],
  },
};

export function categorize(scale: ScaleId, aqi: number | null): Category | null {
  if (aqi == null) return null;
  const cats = SCALES[scale].cats;
  return cats.find((c) => aqi <= c.max) ?? cats[cats.length - 1];
}

/** 0..1 position of a value along the 6-band colour bar (each band = 1/6). */
export function scalePosition(scale: ScaleId, aqi: number): number {
  const cats = SCALES[scale].cats;
  const i = Math.max(0, cats.findIndex((c) => aqi <= c.max));
  const lo = i === 0 ? 0 : cats[i - 1].max;
  const hi = Number.isFinite(cats[i].max) ? cats[i].max : lo * 1.5;
  const frac = Math.min(1, Math.max(0, (aqi - lo) / (hi - lo)));
  return Math.min(0.995, (i + frac) / cats.length);
}

/** Black or white text, whichever reads better on a given background colour. */
export function textOn(hex: string): string {
  const v = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#111827' : '#ffffff';
}

export const HEALTH_ADVICE: string[][] = [
  ['Air quality is good. Enjoy outdoor activities.', 'Open windows to let fresh air in.'],
  ['Air is acceptable for most people.', 'Unusually sensitive people should limit long outdoor exertion.'],
  ['Children, older adults and people with asthma should reduce outdoor exertion.', 'Consider closing windows during peak traffic hours.'],
  ['Everyone should reduce prolonged outdoor exertion.', 'Wear a well-fitted N95 mask outdoors.', 'Run an air purifier indoors if you have one.'],
  ['Avoid outdoor activity.', 'Wear an N95 mask if you must go out.', 'Keep windows closed and run an air purifier.'],
  ['Stay indoors and keep activity levels low.', 'Keep windows and doors closed.', 'Run an air purifier and wear an N95 mask outdoors.', 'Seek medical help if you have trouble breathing.'],
];

// ---------- India AQI (CPCB) ----------
// Concentration breakpoints (µg/m³, CO in mg/m³) for the six bands below.
const IN_BANDS = [[0, 50], [51, 100], [101, 200], [201, 300], [301, 400], [401, 500]];
const IN_BREAKPOINTS: Record<PollutantKey, number[][]> = {
  pm2_5: [[0, 30], [31, 60], [61, 90], [91, 120], [121, 250], [251, 380]],
  pm10: [[0, 50], [51, 100], [101, 250], [251, 350], [351, 430], [431, 600]],
  nitrogen_dioxide: [[0, 40], [41, 80], [81, 180], [181, 280], [281, 400], [401, 600]],
  ozone: [[0, 50], [51, 100], [101, 168], [169, 208], [209, 748], [749, 1000]],
  sulphur_dioxide: [[0, 40], [41, 80], [81, 380], [381, 800], [801, 1600], [1601, 2400]],
  carbon_monoxide: [[0, 1], [1.1, 2], [2.1, 10], [10.1, 17], [17.1, 34], [34.1, 50]],
};

function inSubIndex(key: PollutantKey, c: number): number {
  const bps = IN_BREAKPOINTS[key];
  for (let i = 0; i < bps.length; i++) {
    const [lo, hi] = bps[i];
    if (c <= hi) {
      const [ilo, ihi] = IN_BANDS[i];
      const x = Math.max(c, lo);
      return Math.round(ilo + ((ihi - ilo) * (x - lo)) / (hi - lo));
    }
  }
  return 500;
}

/**
 * India AQI uses 24-hour averages (8-hour for O3 and CO). We average the model's
 * hourly values ending at `end`. It is an estimate, which the UI says.
 */
export function computeIndiaAqi(
  hourly: Partial<Record<PollutantKey, (number | null)[]>>,
  end: number,
): { aqi: number | null; dominant: PollutantKey | null } {
  let best: { aqi: number; key: PollutantKey } | null = null;
  let count = 0;
  let hasPm = false;
  for (const key of POLLUTANTS) {
    const series = hourly[key];
    if (!series) continue;
    const window = key === 'ozone' || key === 'carbon_monoxide' ? 8 : 24;
    const vals = series.slice(Math.max(0, end - window + 1), end + 1)
      .filter((v): v is number => typeof v === 'number');
    if (vals.length < window * 0.75) continue; // not enough data for a fair average
    let mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (key === 'carbon_monoxide') mean /= 1000; // µg/m³ -> mg/m³
    const sub = inSubIndex(key, mean);
    count++;
    if (key === 'pm2_5' || key === 'pm10') hasPm = true;
    if (!best || sub > best.aqi) best = { aqi: sub, key };
  }
  // CPCB rule: at least three pollutants, one of them PM2.5 or PM10.
  if (!best || count < 3 || !hasPm) return { aqi: null, dominant: null };
  return { aqi: best.aqi, dominant: best.key };
}
