import { REVALIDATE_SECONDS } from '@/lib/site';

/** Error with an optional HTTP status, so callers can tell "not found" from "provider down". */
export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Fetch JSON on the server with Next.js caching.
 * `revalidate` = seconds a cached response is reused. One upstream call then serves
 * every visitor for that period, which is what keeps API usage tiny.
 */
export async function getJson<T>(url: string, revalidate: number = REVALIDATE_SECONDS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000); // never hang a page render
  try {
    const res = await fetch(url, { next: { revalidate }, signal: controller.signal });
    if (res.status === 429) throw new ApiError('The data provider is busy right now (rate limit reached)', 429);
    if (!res.ok) throw new ApiError(`The data provider returned an error (${res.status})`, res.status);
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const timedOut = err instanceof Error && err.name === 'AbortError';
    throw new ApiError(timedOut ? 'The data provider took too long to respond' : 'Could not reach the data provider');
  } finally {
    clearTimeout(timer);
  }
}

/** Turn anything into a finite number or null (APIs return null for missing values). */
export const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

/** True when the provider refused us for making too many requests (HTTP 429). */
export const isRateLimit = (err: unknown) => err instanceof ApiError && err.status === 429;

/** True while `next build` is prerendering pages (there's no older page to fall back to then). */
export const isBuildPhase = () => process.env.NEXT_PHASE === 'phase-production-build';

/** Current local time at a place, using the API's utc_offset_seconds: "2026-11-25T14:37". */
export function localNow(utcOffsetSeconds: number): string {
  return new Date(Date.now() + utcOffsetSeconds * 1000).toISOString().slice(0, 16);
}

/** Index of the current hour in an hourly time list (or the closest earlier hour). */
export function hourIndex(times: string[], now: string): number {
  const hour = now.slice(0, 13) + ':00';
  const exact = times.indexOf(hour);
  if (exact >= 0) return exact;
  let last = 0;
  for (let i = 0; i < times.length; i++) if (times[i] <= hour) last = i;
  return last;
}
