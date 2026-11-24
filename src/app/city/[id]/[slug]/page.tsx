import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import CityView from '@/components/CityView';
import { cityHref, getPlace, slugify } from '@/lib/api/geocoding';

export const revalidate = 3600; // each city page is cached and refreshed once an hour

type Props = { params: Promise<{ id: string; slug: string }> };

async function load(idText: string) {
  const id = Number(idText);
  if (!Number.isInteger(id) || id <= 0) return null;
  return getPlace(id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const place = await load(id).catch(() => null);
  if (!place) return { title: 'City not found' };
  const where = [place.name, place.country].filter(Boolean).join(', ');
  return {
    title: `${place.name} weather and AQI today`,
    description: `Current weather, hourly and 7-day forecast, plus live air quality (AQI, PM2.5, PM10) for ${where}.`,
    alternates: { canonical: cityHref(place) },
  };
}

export default async function CityPage({ params }: Props) {
  const { id, slug } = await params;
  const place = await load(id);
  if (!place) notFound();
  if (slug !== slugify(place.name)) permanentRedirect(cityHref(place)); // one URL per city (SEO)

  return (
    <CityView
      name={place.name}
      region={[place.admin1, place.country].filter((x): x is string => Boolean(x) && x !== place.name).join(', ')}
      lat={place.latitude}
      lon={place.longitude}
      href={cityHref(place)}
    />
  );
}
