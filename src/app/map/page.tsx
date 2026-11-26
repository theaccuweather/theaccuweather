import type { Metadata } from 'next';
import Link from 'next/link';
import WorldMap from '@/components/WorldMap';
import ErrorPanel from '@/components/ErrorPanel';
import { mapPoints } from '@/lib/mapData';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Live world air quality map',
  description: 'Map of live US AQI for the world’s biggest cities, with a rain radar layer.',
  alternates: { canonical: '/map' },
};

export default async function MapPage() {
  const data = await mapPoints();
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted"><Link href="/" className="hover:text-link">Home</Link> › Map</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Live world air quality map</h1>
        <p className="text-sm text-muted">
          {data ? `US AQI for ${data.points.length} cities. Click a dot for its weather and AQI. Switch on the rain radar for the last 2 hours of rain.` : ''}
        </p>
      </div>
      {data && data.points.length > 0
        ? <WorldMap points={data.points} />
        : <ErrorPanel title="The map is unavailable right now" detail="Please refresh in a few minutes." />}
    </div>
  );
}
