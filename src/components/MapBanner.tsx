'use client';

/*
 * Full-width street map behind the AQI card, centred on the place, with a dot in its AQI colour.
 * Tiles: OpenStreetMap's standard tiles (free, no API key, credit required). In the dark theme
 * the tiles are darkened with a CSS filter (see .taw-tiles in globals.css), so the Lights switch
 * works without reloading anything. Leaflet loads only in the browser.
 *
 * OpenStreetMap's tile servers are meant for light use. If traffic grows, switch TILE_URL to a
 * provider with a free key (for example MapTiler or Stadia Maps) and keep the credit line.
 */
import { useEffect, useRef, useState } from 'react';
import type * as Leaflet from 'leaflet';
import RadarControls from './RadarControls';
import { attachRadar, type RadarControl } from '@/lib/radar';

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export default function MapBanner({ lat, lon, color }: { lat: number; lon: number; color?: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [radar, setRadar] = useState<RadarControl | null>(null);

  useEffect(() => {
    let map: Leaflet.Map | null = null;
    let cancelled = false;

    import('leaflet')
      .then(async (mod) => {
        const L = ((mod as unknown as { default?: typeof Leaflet }).default ?? mod) as typeof Leaflet;
        if (cancelled || !ref.current) return;
        map = L.map(ref.current, {
          center: [lat, lon],
          zoom: 11,
          zoomControl: false,
          attributionControl: false,
          scrollWheelZoom: false,
          dragging: !L.Browser.mobile, // let phones scroll the page instead of the map
          keyboard: false,
        });
        // Credit sits top-right so the AQI card never covers it.
        L.control.attribution({ position: 'topright', prefix: false }).addTo(map);
        L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19, className: 'taw-tiles' }).addTo(map);
        L.circleMarker([lat, lon], { radius: 9, color: '#ffffff', weight: 3, fillColor: color ?? '#0a7cff', fillOpacity: 1 }).addTo(map);
        const r = await attachRadar(L, map);
        if (!cancelled) setRadar(r);
      })
      .catch(() => { /* leave the plain background if the map can't load */ });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lon, color]);

  return (
    <div className="relative z-0 -mt-4 ml-[calc(50%-50vw)] h-56 w-screen bg-raised sm:h-72">
      <div ref={ref} className="h-full w-full" />
      <div className="pointer-events-none absolute left-3 top-3 z-[500]"><RadarControls radar={radar} /></div>
    </div>
  );
}
