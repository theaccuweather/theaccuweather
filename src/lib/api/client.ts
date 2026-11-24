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
