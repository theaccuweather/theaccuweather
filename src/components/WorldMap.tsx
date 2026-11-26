'use client';

/*
 * World AQI map: one dot per city in its US AQI colour; click for weather and AQI with a link
 * to the city page. Optional rain radar on top. Leaflet loads only in the browser.
 */
import { useEffect, useRef, useState } from 'react';
import type * as Leaflet from 'leaflet';
import RadarControls from './RadarControls';
import { attachRadar, type RadarControl } from '@/lib/radar';
import { categorize, SCALES } from '@/lib/aqi';
import { describeWeather } from '@/lib/weatherCodes';
import type { MapPoint } from '@/lib/mapData';

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export default function WorldMap({ points }: { points: MapPoint[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [radar, setRadar] = useState<RadarControl | null>(null);

  useEffect(() => {
    let map: Leaflet.Map | null = null;
    let cancelled = false;
    import('leaflet')
      .then(async (mod) => {
        const L = ((mod as unknown as { default?: typeof Leaflet }).default ?? mod) as typeof Leaflet;
        if (cancelled || !ref.current) return;
        map = L.map(ref.current, { center: [22, 20], zoom: 2, minZoom: 2, worldCopyJump: true, scrollWheelZoom: false });
        L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 12, className: 'taw-tiles' }).addTo(map);
        for (const p of points) {
          const cat = categorize('us', p.aqi);
          const w = p.code != null ? describeWeather(p.code).label : null;
          L.circleMarker([p.lat, p.lon], {
            radius: 7, weight: 2, color: '#ffffff', fillColor: cat?.color ?? '#9ca3af', fillOpacity: 0.95,
          })
            .bindPopup(
              `<div style="font:13px/1.45 system-ui,sans-serif;min-width:150px">
                 <b style="font-size:14px">${esc(p.name)}</b><br><span style="color:#5b6475">${esc(p.country)}</span><br>
                 ${p.temp != null ? `${Math.round(p.temp)}°C${w ? ` · ${esc(w)}` : ''}<br>` : ''}
                 US AQI <b>${p.aqi ?? '—'}</b>${cat ? ` · ${esc(cat.label)}` : ''}<br>
                 <a href="${p.href}">Open forecast and AQI</a>
               </div>`,
            )
            .addTo(map);
        }
        const r = await attachRadar(L, map);
        if (!cancelled) setRadar(r);
      })
      .catch(() => { /* leave the plain background if the map can't load */ });
    return () => { cancelled = true; map?.remove(); };
  }, [points]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line">
      <div ref={ref} className="h-[60vh] min-h-[380px] w-full bg-raised" />
      <div className="pointer-events-none absolute left-3 top-3 z-[500]"><RadarControls radar={radar} /></div>
      <div className="absolute bottom-3 left-3 z-[500] flex flex-wrap gap-x-3 gap-y-1 rounded-xl bg-card/90 px-3 py-2 text-[11px] shadow backdrop-blur">
        {SCALES.us.cats.map((c) => (
          <span key={c.label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
            {c.label.replace('Unhealthy for sensitive groups', 'Sensitive groups')}
          </span>
        ))}
      </div>
    </div>
  );
}
