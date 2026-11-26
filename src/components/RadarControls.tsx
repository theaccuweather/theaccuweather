'use client';

// Radar on/off switch with play/pause and the frame time. Used on the world map and city map.
import { useEffect, useRef, useState } from 'react';
import type { RadarControl } from '@/lib/radar';

export default function RadarControls({ radar }: { radar: RadarControl | null }) {
  const [on, setOn] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [frame, setFrame] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!radar) return;
    if (!on) { radar.hide(); return; }
    const last = radar.frames - 1;
    setFrame(last);
    radar.show(last);
  }, [on, radar]);

  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (!radar || !on || !playing) return;
    timer.current = setInterval(() => {
      setFrame((f) => {
        const n = (f + 1) % radar.frames;
        radar.show(n);
        return n;
      });
    }, 700);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [radar, on, playing]);

  if (!radar) return null;
  const t = new Date(radar.time(frame) * 1000);
  return (
    <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-line bg-card/90 px-2 py-1 text-xs shadow backdrop-blur">
      <button type="button" aria-pressed={on} onClick={() => setOn((v) => !v)}
        className={`rounded-full px-3 py-1 font-medium ${on ? 'bg-brand text-white' : 'text-ink hover:text-link'}`}>
        Rain radar
      </button>
      {on && (
        <>
          <button type="button" onClick={() => setPlaying((p) => !p)} className="rounded-full px-2 py-1 text-ink hover:text-link"
            aria-label={playing ? 'Pause radar' : 'Play radar'}>
            {playing ? 'Pause' : 'Play'}
          </button>
          <span className="tabular-nums text-muted">{t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </>
      )}
    </div>
  );
}
