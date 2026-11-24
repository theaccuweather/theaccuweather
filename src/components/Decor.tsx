// Original artwork for the AQI card: a cloud mascot whose face changes with the air
// quality, and a generic city skyline. Plain SVG, no image files.

export function Mascot({ level, className = '' }: { level: number; className?: string }) {
  const masked = level >= 3;
  const mouth = level <= 0 ? 'M76 96 Q90 110 104 96' : level === 1 ? 'M79 98 Q90 105 101 98' : 'M80 100 L100 100';
  const cloud = (fill: string, dy = 0) => (
    <g fill={fill} transform={`translate(0 ${dy})`}>
      <circle cx="52" cy="92" r="30" />
      <circle cx="88" cy="70" r="40" />
      <circle cx="126" cy="90" r="28" />
      <rect x="30" y="90" width="124" height="34" rx="17" />
    </g>
  );
  return (
    <svg viewBox="0 0 180 160" className={className} role="img"
      aria-label={masked ? 'Cloud mascot wearing a face mask' : 'Smiling cloud mascot'}>
      <ellipse cx="92" cy="150" rx="48" ry="6" fill="#000" opacity="0.18" />
      {cloud('#c9d6e6', 5)}
      {cloud('#f8fafc')}
      {level >= 4 && (
        <g stroke="#1f2633" strokeWidth="3" strokeLinecap="round">
          <path d="M67 74 L82 79" />
          <path d="M113 74 L98 79" />
        </g>
      )}
      <circle cx="76" cy="88" r="5.5" fill="#1f2633" />
      <circle cx="104" cy="88" r="5.5" fill="#1f2633" />
      <circle cx="78" cy="86" r="1.6" fill="#fff" />
      <circle cx="106" cy="86" r="1.6" fill="#fff" />
      {level <= 1 && (
        <g fill="#fda4af" opacity="0.75">
          <circle cx="64" cy="100" r="6" />
          <circle cx="116" cy="100" r="6" />
        </g>
      )}
      {masked ? (
        <g>
          <path d="M70 96 L50 90 M110 96 L130 90" stroke="#94a3b8" strokeWidth="2" />
          <path d="M70 94 Q90 88 110 94 L108 112 Q90 120 72 112 Z" fill="#e0f2fe" stroke="#94a3b8" strokeWidth="1.5" />
          <path d="M76 102 Q90 98 104 102 M76 108 Q90 104 104 108" fill="none" stroke="#94a3b8" strokeWidth="1.2" />
        </g>
      ) : (
        <path d={mouth} fill="none" stroke="#1f2633" strokeWidth="3.5" strokeLinecap="round" />
      )}
    </svg>
  );
}

const BUILDINGS: [number, number, number][] = [
  [0, 40, 50], [44, 26, 80], [74, 36, 60], [114, 20, 96], [138, 44, 70], [186, 30, 110], [220, 40, 64],
  [264, 24, 88], [292, 50, 56], [346, 28, 104], [378, 38, 72], [420, 22, 90], [446, 46, 62], [496, 30, 118],
  [530, 40, 76], [574, 26, 94], [604, 48, 58], [656, 28, 100], [688, 40, 70], [732, 22, 86], [758, 44, 64],
  [806, 30, 112], [840, 38, 74], [882, 26, 92], [912, 50, 60], [966, 28, 106], [998, 40, 68], [1042, 24, 90],
  [1070, 46, 66], [1120, 30, 98], [1154, 46, 72],
];

export function Skyline({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className={className} aria-hidden="true">
      <g fill="currentColor">
        {BUILDINGS.map(([x, w, h]) => <rect key={x} x={x} y={120 - h} width={w} height={h} />)}
      </g>
    </svg>
  );
}
