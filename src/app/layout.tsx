import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SITE } from '@/lib/site';

config.autoAddCss = false; // we import the Font Awesome CSS above instead

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-poppins', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: 'theaccuweather \u2014 live AQI and weather worldwide', template: '%s | theaccuweather' },
  description: SITE.description,
  openGraph: { siteName: SITE.name, type: 'website' },
};

export const viewport: Viewport = { themeColor: '#0a7cff', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="min-h-screen font-sans">
        <Header />
        <main className="mx-auto w-full max-w-6xl px-3 pb-10 pt-4 sm:px-4">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
