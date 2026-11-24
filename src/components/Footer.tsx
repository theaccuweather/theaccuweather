import Link from 'next/link';
import { SITE } from '@/lib/site';

export default function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-6xl space-y-1 px-4 py-5 text-center text-xs text-muted">
        <p>&copy; {new Date().getFullYear()} theaccuweather &middot; {SITE.disclaimer} &middot; <Link href="/about" className="hover:text-brand">About</Link></p>
        <p>
          Weather and air-quality data by <a href="https://open-meteo.com/" className="hover:text-brand" target="_blank" rel="noopener">Open-Meteo.com</a> (CC BY 4.0)
          &middot; Earth imagery: NASA Visible Earth
        </p>
      </div>
    </footer>
  );
}
