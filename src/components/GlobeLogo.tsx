'use client';

/*
 * The real-colour Earth logo.
 * - Paints NASA's Blue Marble image onto a sphere with plain canvas maths (no 3D library).
 * - On load it spins in and settles facing the visitor's country (from Vercel's IP headers,
 *   or the browser's time zone as a fallback). City pages turn it to that city instead.
 * - The ring shows the AQI colour of the place it's facing.
 * - Pauses when the tab is hidden; respects "reduce motion".
 */
import { useEffect, useRef, useState } from 'react';

export type GlobeFocus = { lat: number; lon: number; color?: string };
type Stored = GlobeFocus & { source: 'page' | 'ip' };
declare global {
  interface Window { __tawFocus?: Stored }
}

const EVENT = 'taw:focus';
const TWO = Math.PI * 2;
const D = Math.PI / 180;
const wrap = (a: number) => ((a % TWO) + TWO * 1.5) % TWO - Math.PI; // shortest angle difference

/** Point every globe on the page at a place. Page focus (a city) beats IP focus. */
export function focusGlobe(f: GlobeFocus, source: 'page' | 'ip' = 'page') {
  if (typeof window === 'undefined') return;
  if (source === 'ip' && window.__tawFocus?.source === 'page') return;
  window.__tawFocus = { ...f, source };
  window.dispatchEvent(new CustomEvent(EVENT, { detail: window.__tawFocus }));
}

// ---- shared texture (loaded once for every globe instance) ----
type Tex = { d: Uint8ClampedArray; w: number; h: number };
let texPromise: Promise<Tex> | null = null;
function loadTexture(): Promise<Tex> {
  texPromise ??= new Promise<Tex>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const w = 1600, h = 800;
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      if (!ctx) return reject(new Error('Canvas unavailable'));
      ctx.drawImage(img, 0, 0, w, h);
      resolve({ d: ctx.getImageData(0, 0, w, h).data, w, h });
    };
    img.onerror = () => reject(new Error('Earth image failed to load'));
    img.src = '/earth-2k.jpg';
  });
  return texPromise;
}

// ---- visitor location (asked once) ----
let ipPromise: Promise<GlobeFocus> | null = null;
function locateVisitor(): Promise<GlobeFocus> {
  ipPromise ??= fetch('/api/locate')
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => (d && typeof d.lat === 'number' ? { lat: d.lat, lon: d.lon } : timeZoneGuess()))
    .catch(() => timeZoneGuess());
  return ipPromise;
}
function timeZoneGuess(): GlobeFocus {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  const table: [RegExp, number, number][] = [
    [/Calcutta|Kolkata/, 22, 79], [/Tokyo/, 36, 138], [/Shanghai|Chongqing|Harbin/, 35, 105],
    [/Sao_Paulo|Argentina|Santiago|Lima|Bogota/, -12, -60], [/^America\//, 39, -98],
    [/^Australia\//, -25, 134], [/Auckland/, -41, 174], [/^Europe\//, 50, 10],
    [/^Africa\//, 5, 20], [/Dubai|Riyadh|Qatar|Kuwait|Tehran|Baghdad/, 25, 50], [/^Asia\//, 25, 100],
  ];
  const hit = table.find(([re]) => re.test(tz));
  return hit ? { lat: hit[1], lon: hit[2] } : { lat: 20, lon: 0 };
}

// ---- sphere maths: precompute each pixel's 3D position and lighting once ----
type Sphere = {
  ctx: CanvasRenderingContext2D; img: ImageData; N: number; R: number;
  idx: Int32Array; X: Float32Array; Y: Float32Array; Z: Float32Array; SH: Float32Array; RM: Float32Array;
};
function setupSphere(canvas: HTMLCanvasElement, N: number): Sphere | null {
  canvas.width = N; canvas.height = N;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const img = ctx.createImageData(N, N);
  const R = N / 2 - 0.5;
  const L = [-0.5, 0.45, 0.74];
  const ln = Math.hypot(L[0], L[1], L[2]);
  const [lx, ly, lz] = L.map((v) => v / ln); // light from the upper left
  const idx: number[] = [], X: number[] = [], Y: number[] = [], Z: number[] = [], SH: number[] = [], RM: number[] = [];
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const x = (i + 0.5 - N / 2) / R, y = -(j + 0.5 - N / 2) / R, d = x * x + y * y;
      if (d > 1) continue;
      const z = Math.sqrt(1 - d);
      idx.push((j * N + i) * 4); X.push(x); Y.push(y); Z.push(z);
      const lambert = Math.max(0, x * lx + y * ly + z * lz);
      SH.push(0.28 + 0.9 * lambert + 0.25 * Math.pow(lambert, 18)); // shade + soft highlight
      RM.push(Math.pow(1 - z, 2.4)); // atmosphere haze towards the edge
    }
  }
  return {
    ctx, img, N, R, idx: Int32Array.from(idx), X: Float32Array.from(X), Y: Float32Array.from(Y),
    Z: Float32Array.from(Z), SH: Float32Array.from(SH), RM: Float32Array.from(RM),
  };
}

function render(g: Sphere, tex: Tex, lam0: number, phi: number, mark: GlobeFocus | null, pulse: number | null) {
  const { img, idx, X, Y, Z, SH, RM, N, R, ctx } = g;
  const out = img.data, c = Math.cos(phi), s = Math.sin(phi);
  for (let k = 0; k < idx.length; k++) {
    const x = X[k], y = Y[k], z = Z[k];
    let y1 = y * c + z * s;
    y1 = y1 > 1 ? 1 : y1 < -1 ? -1 : y1;
    const z1 = -y * s + z * c;
    const lat = Math.asin(y1), lon = Math.atan2(x, z1) + lam0;
    let u = (lon / TWO + 0.5) % 1;
    if (u < 0) u += 1;
    const tx = (u * tex.w) | 0, ty = Math.min(tex.h - 1, ((0.5 - lat / Math.PI) * tex.h) | 0);
    const ti = (ty * tex.w + tx) * 4, sh = SH[k], rm = RM[k] * 0.6;
    let r = tex.d[ti] * sh, gg = tex.d[ti + 1] * sh, b = tex.d[ti + 2] * sh;
    r += (110 - r) * rm; gg += (175 - gg) * rm; b += (255 - b) * rm;
    const o = idx[k];
    out[o] = r; out[o + 1] = gg; out[o + 2] = b; out[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  if (!mark) return;
  // Marker for the focused place, only when it's on the visible side.
  const la = mark.lat * D, dl = mark.lon * D - lam0, cl = Math.cos(la);
  const x1 = cl * Math.sin(dl), y1 = Math.sin(la), z1 = cl * Math.cos(dl);
  const y = y1 * c - z1 * s, z = y1 * s + z1 * c;
  if (z < 0.05) return;
  const px = N / 2 + x1 * R, py = N / 2 - y * R, k = N / 240;
  if (pulse != null) {
    ctx.globalAlpha = (1 - pulse) * 0.95;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.2 * k;
    ctx.beginPath(); ctx.arc(px, py, (6 + pulse * 22) * k, 0, TWO); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = mark.color ?? '#0a7cff'; ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2.4 * k, 1);
  ctx.beginPath(); ctx.arc(px, py, Math.max(6 * k, 2.4), 0, TWO); ctx.fill(); ctx.stroke();
}

export default function GlobeLogo({ size = 42, interactive = false }: { size?: number; interactive?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ring, setRing] = useState('#0a7cff');
  const big = size >= 80;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const g = setupSphere(canvas, Math.round(size * 0.78 * dpr));
    if (!g) return;

    let tex: Tex | null = null;
    let raf = 0, alive = true, first = true, dragging = false, lastUser = 0;
    const rot = { lam: 0, phi: 0.3 }, tgt = { lam: 0, phi: 0 };
    let settle = 0; // the exact longitude we ease towards
    let mark: GlobeFocus | null = null;

    const draw = (p: number | null) => { if (tex) render(g, tex, rot.lam, rot.phi, big ? mark : null, p); };

    const apply = (f: GlobeFocus) => {
      mark = f;
      tgt.lam = f.lon * D;
      tgt.phi = Math.max(-50, Math.min(50, f.lat * 0.8)) * D;
      settle = rot.lam + wrap(tgt.lam - rot.lam);
      if (first && !reduce) { rot.lam = settle - 3 * Math.PI; rot.phi = tgt.phi + 0.3; } // 1.5-turn spin-in
      if (reduce) { rot.lam = settle; rot.phi = tgt.phi; draw(null); }
      first = false;
      lastUser = 0;
      if (f.color) setRing(f.color);
    };
    const onFocus = (e: Event) => apply((e as CustomEvent<GlobeFocus>).detail);
    window.addEventListener(EVENT, onFocus);

    const frame = (t: number) => {
      if (!alive) return;
      if (!document.hidden && tex) {
        if (!dragging && t - lastUser > 2200) {
          const goal = settle + Math.sin(t / 2600) * 0.09; // gentle sway after settling
          rot.lam += (goal - rot.lam) * 0.035;
          rot.phi += (tgt.phi - rot.phi) * 0.035;
        }
        draw((t % 1800) / 1800);
      }
      raf = requestAnimationFrame(frame);
    };

    loadTexture()
      .then((t) => {
        if (!alive) return;
        tex = t;
        if (window.__tawFocus) { if (first) apply(window.__tawFocus); }
        else locateVisitor().then((f) => focusGlobe(f, 'ip'));
        if (reduce) draw(null); else raf = requestAnimationFrame(frame);
      })
      .catch(() => { /* keep the plain ocean-blue circle */ });

    // Drag to spin (large globe only).
    let sx = 0, sy = 0, r0 = { ...rot };
    const down = (e: PointerEvent) => { dragging = true; sx = e.clientX; sy = e.clientY; r0 = { ...rot }; canvas.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const k = Math.PI / canvas.clientWidth;
      rot.lam = r0.lam - (e.clientX - sx) * k;
      rot.phi = Math.max(-1.3, Math.min(1.3, r0.phi + (e.clientY - sy) * k));
      lastUser = performance.now();
      if (reduce) draw(null);
    };
    const up = () => { dragging = false; lastUser = performance.now(); settle = rot.lam + wrap(tgt.lam - rot.lam); };
    if (interactive) {
      canvas.addEventListener('pointerdown', down);
      canvas.addEventListener('pointermove', move);
      canvas.addEventListener('pointerup', up);
      canvas.addEventListener('pointercancel', up);
    }

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener(EVENT, onFocus);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
    };
  }, [size, interactive, big]);

  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <span
        className="absolute overflow-hidden rounded-full bg-[#0d2a52]"
        style={{ inset: '11%', boxShadow: `0 0 ${Math.round(size * 0.09)}px ${Math.max(1, Math.round(size * 0.02))}px rgba(80,150,255,.38)` }}
      >
        <canvas
          ref={canvasRef}
          className="block h-full w-full rounded-full"
          style={interactive ? { cursor: 'grab', touchAction: 'none' } : undefined}
        />
      </span>
      <svg viewBox="0 0 200 200" className="pointer-events-none absolute inset-0 h-full w-full">
        <circle cx="100" cy="100" r={big ? 94 : 92} fill="none" stroke={ring} strokeWidth={big ? 6 : 14} style={{ transition: 'stroke .8s ease' }} />
        {big && (
          <g className="taw-orbit">
            <circle cx="100" cy="6" r="6" fill="#4da3ff" stroke="#050a14" strokeWidth="3" />
          </g>
        )}
      </svg>
    </span>
  );
}
