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

// ---------- Shared helpers ----------
type Hourly = Partial<Record<PollutantKey, (number | null)[]>>;

/** The standard AQI formula: interpolate inside the band a concentration falls into. */
function interpolate(bps: number[][], bands: number[][], c: number): number {
  for (let i = 0; i < bps.length; i++) {
    const [lo, hi] = bps[i];
    if (c <= hi) {
      const [ilo, ihi] = bands[i];
      const x = Math.max(c, lo);
      return Math.round(ilo + ((ihi - ilo) * (x - lo)) / (hi - lo));
    }
  }
  return bands[bands.length - 1][1];
}

/** Mean of the last `hours` hourly values ending at `end`; null if fewer than 75% have data. */
function windowMean(series: (number | null)[] | undefined, end: number, hours: number): number | null {
  if (!series) return null;
  const vals = series.slice(Math.max(0, end - hours + 1), end + 1).filter((v): v is number => typeof v === 'number');
  if (vals.length === 0 || vals.length < hours * 0.75) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** The pollutant with the highest sub-index: the "main pollutant". */
export function mainPollutant(subs: Partial<Record<PollutantKey, number>>): PollutantKey | null {
  let best: PollutantKey | null = null;
  let max = -1;
  for (const key of POLLUTANTS) {
    const v = subs[key];
    if (v != null && v > max) { max = v; best = key; }
  }
  return best;
}

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

/**
 * India AQI uses 24-hour averages (8-hour for O3 and CO). We average the model's
 * hourly values ending at `end`. It is an estimate, which the UI says.
 */
export function computeIndiaAqi(hourly: Hourly, end: number): { aqi: number | null; dominant: PollutantKey | null } {
  let best: { aqi: number; key: PollutantKey } | null = null;
  let count = 0;
  let hasPm = false;
  for (const key of POLLUTANTS) {
    const hours = key === 'ozone' || key === 'carbon_monoxide' ? 8 : 24;
    let mean = windowMean(hourly[key], end, hours);
    if (mean == null) continue; // not enough data for a fair average
    if (key === 'carbon_monoxide') mean /= 1000; // µg/m³ -> mg/m³
    const sub = interpolate(IN_BREAKPOINTS[key], IN_BANDS, mean);
    count++;
    if (key === 'pm2_5' || key === 'pm10') hasPm = true;
    if (!best || sub > best.aqi) best = { aqi: sub, key };
  }
  // CPCB rule: at least three pollutants, one of them PM2.5 or PM10.
  if (!best || count < 3 || !hasPm) return { aqi: null, dominant: null };
  return { aqi: best.aqi, dominant: best.key };
}

// ---------- US sub-indices (EPA breakpoints) ----------
// The headline US AQI comes from Open-Meteo. We work out each pollutant's own sub-index
// only to colour the pollutant cards and name the main pollutant. Gases are converted
// from µg/m³ to ppb (ppm for CO) at 25 °C.
const US_BANDS = [[0, 50], [51, 100], [101, 150], [151, 200], [201, 300], [301, 500]];
const US_BREAKPOINTS: Record<PollutantKey, number[][]> = {
  pm2_5: [[0, 9], [9.1, 35.4], [35.5, 55.4], [55.5, 125.4], [125.5, 225.4], [225.5, 325.4]], // µg/m³, 24 h
  pm10: [[0, 54], [55, 154], [155, 254], [255, 354], [355, 424], [425, 604]], // µg/m³, 24 h
  ozone: [[0, 54], [55, 70], [71, 85], [86, 105], [106, 200], [201, 404]], // ppb, 8 h
  carbon_monoxide: [[0, 4.4], [4.5, 9.4], [9.5, 12.4], [12.5, 15.4], [15.5, 30.4], [30.5, 50.4]], // ppm, 8 h
  sulphur_dioxide: [[0, 35], [36, 75], [76, 185], [186, 304], [305, 604], [605, 1004]], // ppb, 1 h
  nitrogen_dioxide: [[0, 53], [54, 100], [101, 360], [361, 649], [650, 1249], [1250, 2049]], // ppb, 1 h
};
const US_RULES: Record<PollutantKey, { hours: number; factor: number }> = {
  pm2_5: { hours: 24, factor: 1 },
  pm10: { hours: 24, factor: 1 },
  ozone: { hours: 8, factor: 1 / 1.96 },
  carbon_monoxide: { hours: 8, factor: 1 / 1145 },
  sulphur_dioxide: { hours: 1, factor: 1 / 2.62 },
  nitrogen_dioxide: { hours: 1, factor: 1 / 1.88 },
};

export function computeUsSubIndices(hourly: Hourly, end: number): Partial<Record<PollutantKey, number>> {
  const out: Partial<Record<PollutantKey, number>> = {};
  for (const key of POLLUTANTS) {
    const { hours, factor } = US_RULES[key];
    const mean = windowMean(hourly[key], end, hours);
    if (mean != null) out[key] = interpolate(US_BREAKPOINTS[key], US_BANDS, mean * factor);
  }
  return out;
}

// ---------- European sub-indices (EEA bands, as documented by Open-Meteo) ----------
// Only used to name the main pollutant on the EU scale. CO is not part of the EU index.
const EU_BANDS = [[0, 20], [20, 40], [40, 60], [60, 80], [80, 100], [100, 120]];
const EU_RULES: Partial<Record<PollutantKey, { hours: number; bps: number[][] }>> = {
  pm2_5: { hours: 24, bps: [[0, 10], [10, 20], [20, 25], [25, 50], [50, 75], [75, 800]] },
  pm10: { hours: 24, bps: [[0, 20], [20, 40], [40, 50], [50, 100], [100, 150], [150, 1200]] },
  nitrogen_dioxide: { hours: 1, bps: [[0, 40], [40, 90], [90, 120], [120, 230], [230, 340], [340, 1000]] },
  ozone: { hours: 1, bps: [[0, 50], [50, 100], [100, 130], [130, 240], [240, 380], [380, 800]] },
  sulphur_dioxide: { hours: 1, bps: [[0, 100], [100, 200], [200, 350], [350, 500], [500, 750], [750, 1250]] },
};

export function computeEuSubIndices(hourly: Hourly, end: number): Partial<Record<PollutantKey, number>> {
  const out: Partial<Record<PollutantKey, number>> = {};
  for (const key of POLLUTANTS) {
    const rule = EU_RULES[key];
    if (!rule) continue;
    const mean = windowMean(hourly[key], end, rule.hours);
    if (mean != null) out[key] = interpolate(rule.bps, EU_BANDS, mean);
  }
  return out;
}
