// Rain radar from RainViewer (free, no key, no uptime guarantee). Browser-only helper shared
// by the world map and the city map strip. If RainViewer is down, the radar switch hides itself.
import type * as Leaflet from 'leaflet';

type Frame = { time: number; path: string };
type Maps = { host?: string; radar?: { past?: Frame[]; nowcast?: Frame[] } };

let cache: Promise<{ host: string; frames: Frame[] } | null> | null = null;

/** The last ~2 hours of radar frames (oldest first), fetched once per page view. */
export function loadRadar() {
  cache ??= fetch('https://api.rainviewer.com/public/weather-maps.json', { cache: 'no-store' })
    .then((r) => (r.ok ? (r.json() as Promise<Maps>) : null))
    .then((d) => {
      const frames = d?.radar?.past ?? [];
      return d?.host && frames.length ? { host: d.host, frames } : null;
    })
    .catch(() => null);
  return cache;
}

export type RadarControl = { frames: number; show: (i: number) => void; hide: () => void; time: (i: number) => number };

/** Adds one tile layer per frame (hidden); show(i) fades frame i in. */
export async function attachRadar(L: typeof Leaflet, map: Leaflet.Map): Promise<RadarControl | null> {
  const data = await loadRadar();
  if (!data) return null;
  const layers = data.frames.map((f) =>
    L.tileLayer(`${data.host}${f.path}/256/{z}/{x}/{y}/2/1_1.png`, {
      opacity: 0, maxNativeZoom: 7, maxZoom: 19, zIndex: 400,
      attribution: '<a href="https://www.rainviewer.com/">RainViewer</a>',
    }),
  );
  let current = -1;
  return {
    frames: layers.length,
    time: (i) => data.frames[i]?.time ?? 0,
    show(i) {
      const next = layers[i];
      if (!next) return;
      if (!map.hasLayer(next)) next.addTo(map);
      next.setOpacity(0.7);
      if (current >= 0 && current !== i) layers[current].setOpacity(0);
      current = i;
    },
    hide() {
      layers.forEach((l) => { l.setOpacity(0); map.removeLayer(l); });
      current = -1;
    },
  };
}
