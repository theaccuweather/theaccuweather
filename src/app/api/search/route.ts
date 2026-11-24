import { NextResponse } from 'next/server';
import { cityHref, searchPlaces } from '@/lib/api/geocoding';

// GET /api/search?q=delhi  -> [{ id, name, admin1, country, href }]
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ results: [] });
  try {
    const places = await searchPlaces(q.slice(0, 80));
    const results = places.map((p) => ({ id: p.id, name: p.name, admin1: p.admin1, country: p.country, href: cityHref(p) }));
    return NextResponse.json({ results }, { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } });
  } catch {
    return NextResponse.json({ error: 'Search is unavailable right now. Please try again.' }, { status: 502 });
  }
}
