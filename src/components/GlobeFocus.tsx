'use client';

// Drop this on a page to turn the globe logo to that place (and colour its ring).
import { useEffect } from 'react';
import { focusGlobe } from './GlobeLogo';

export default function GlobeFocus({ lat, lon, color }: { lat: number; lon: number; color?: string }) {
  useEffect(() => {
    focusGlobe({ lat, lon, color }, 'page');
    return () => {
      // Leaving the page: let the next page (or the visitor's own location) take over.
      if (window.__tawFocus?.source === 'page') window.__tawFocus = { ...window.__tawFocus, source: 'ip' };
    };
  }, [lat, lon, color]);
  return null;
}
