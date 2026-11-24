import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // depends on each visitor's request

// Vercel adds the visitor's approximate location (from their IP) to every request, for free.
// Locally these headers don't exist, so the browser falls back to its time zone.
export async function GET(req: Request) {
  const h = req.headers;
  const lat = Number(h.get('x-vercel-ip-latitude'));
  const lon = Number(h.get('x-vercel-ip-longitude'));
  const cityRaw = h.get('x-vercel-ip-city');
  const ok = h.has('x-vercel-ip-latitude') && Number.isFinite(lat) && Number.isFinite(lon);
  return NextResponse.json(
    {
      lat: ok ? lat : null,
      lon: ok ? lon : null,
      city: cityRaw ? decodeURIComponent(cityRaw) : null,
      country: h.get('x-vercel-ip-country'),
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
