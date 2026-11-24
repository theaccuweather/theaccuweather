import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CityView from '@/components/CityView';

// Weather for exact coordinates (used by "Use my location"). Not indexed by Google.
export const metadata: Metadata = { title: 'Your location', robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function HerePage({ searchParams }: Props) {
  const sp = await searchParams;
  const lat = Number(sp.lat);
  const lon = Number(sp.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) notFound();
  const name = typeof sp.name === 'string' && sp.name.trim() ? sp.name.trim().slice(0, 60) : 'Your location';
  // Round to ~1 km so nearby requests share the same cached data.
  return <CityView name={name} lat={Math.round(lat * 100) / 100} lon={Math.round(lon * 100) / 100} region="" />;
}
