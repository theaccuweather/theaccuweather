// The visitor's chosen AQI standard (US / India / EU), shared by every component on the page.
// Saved in the browser; first-time visitors in India get the India scale, others the US scale.
import { useEffect, useState } from 'react';
import type { ScaleId } from './aqi';

const KEY = 'taw-scale';
const EVENT = 'taw:scale';

function initialScale(): ScaleId {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'us' || saved === 'in' || saved === 'eu') return saved;
  } catch { /* storage blocked */ }
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  return /Calcutta|Kolkata/.test(tz) ? 'in' : 'us';
}

export function useScale(): [ScaleId, (s: ScaleId) => void] {
  const [scale, setScale] = useState<ScaleId>('us');
  useEffect(() => {
    setScale(initialScale());
    const onChange = (e: Event) => setScale((e as CustomEvent<ScaleId>).detail);
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);
  const choose = (s: ScaleId) => {
    try { localStorage.setItem(KEY, s); } catch { /* storage blocked */ }
    window.dispatchEvent(new CustomEvent(EVENT, { detail: s }));
  };
  return [scale, choose];
}
