'use client';

// "Lights" switch in the header: dark theme (default) or light theme, remembered in the browser.
import { useEffect, useState } from 'react';
import Icon from './Icon';

export default function ThemeToggle() {
  const [light, setLight] = useState(false);
  useEffect(() => setLight(document.documentElement.classList.contains('light')), []);
  const toggle = () => {
    const next = !light;
    document.documentElement.classList.toggle('light', next);
    try { localStorage.setItem('taw-theme', next ? 'light' : 'dark'); } catch { /* storage blocked */ }
    setLight(next);
    window.dispatchEvent(new CustomEvent('taw:theme', { detail: next ? 'light' : 'dark' }));
  };
  return (
    <button type="button" onClick={toggle} aria-pressed={light}
      aria-label={light ? 'Switch to the dark theme' : 'Switch to the light theme'}
      className="flex flex-col items-center text-[11px] leading-tight text-muted hover:text-ink">
      <span className="hidden sm:block">Lights {light ? 'on' : 'off'}</span>
      <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-full border border-line bg-page text-ink">
        <Icon name={light ? 'sun' : 'moon'} />
      </span>
    </button>
  );
}
