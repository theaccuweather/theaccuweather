import type { Metadata } from 'next';
import Section from '@/components/Section';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'About and data sources' };

export default function AboutPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">About theaccuweather</h1>
      <Section title="What this site is">
        <p className="text-sm leading-relaxed">
          theaccuweather shows live air quality and weather for cities around the world. It is a free,
          non-commercial project. {SITE.disclaimer}
        </p>
      </Section>
      <Section title="Where the data comes from">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li>Weather forecasts and air-quality data: <a className="text-brand hover:underline" href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo.com</a>, licensed under CC BY 4.0. Air quality comes from the CAMS global model, so it is an estimate for the area, not a reading from a street-level sensor.</li>
          <li>City search: Open-Meteo Geocoding, based on GeoNames (CC BY 4.0).</li>
          <li>Earth imagery in the logo: NASA Visible Earth, Blue Marble (public domain).</li>
          <li>Icons: Font Awesome Free (CC BY 4.0).</li>
        </ul>
      </Section>
      <Section title="How AQI scales are shown">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li>US AQI (EPA) is the default everywhere.</li>
          <li>India AQI follows CPCB breakpoints. We estimate it from 24-hour averages (8-hour for ozone and carbon monoxide) of the model data, so it can differ from official CPCB station values.</li>
          <li>European AQI follows the European Environment Agency&rsquo;s bands.</li>
        </ul>
      </Section>
    </div>
  );
}
