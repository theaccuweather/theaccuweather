// Cities the visitor saved with the heart button (kept in their browser only).
export type SavedCity = { name: string; region: string; href: string };

const KEY = 'taw-saved';
export const SAVED_EVENT = 'taw:saved';

export function readSaved(): SavedCity[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(v)) return [];
    return v.filter((c): c is SavedCity => !!c && typeof c.name === 'string' && typeof c.href === 'string')
      .map((c) => ({ name: c.name, region: typeof c.region === 'string' ? c.region : '', href: c.href }));
  } catch {
    return [];
  }
}

/** Save or un-save a city. Returns true if it is now saved. */
export function toggleSaved(city: SavedCity): boolean {
  const list = readSaved();
  const i = list.findIndex((c) => c.href === city.href);
  if (i >= 0) list.splice(i, 1);
  else list.unshift(city);
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 12))); } catch { /* storage blocked */ }
  window.dispatchEvent(new Event(SAVED_EVENT));
  return i < 0;
}
