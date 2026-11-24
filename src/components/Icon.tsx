'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBolt, faCloud, faCloudMoon, faCloudRain, faCloudShowersHeavy, faCloudSun, faCloudSunRain,
  faDroplet, faLocationCrosshairs, faMagnifyingGlass, faMoon, faSmog, faSnowflake, faSun, faWind,
} from '@fortawesome/free-solid-svg-icons';
import type { WeatherIconName } from '@/lib/weatherCodes';

const ICONS = {
  sun: faSun, moon: faMoon, 'cloud-sun': faCloudSun, 'cloud-moon': faCloudMoon, cloud: faCloud, smog: faSmog,
  'cloud-rain': faCloudRain, 'cloud-showers-heavy': faCloudShowersHeavy, 'cloud-sun-rain': faCloudSunRain,
  snowflake: faSnowflake, bolt: faBolt, droplet: faDroplet, wind: faWind,
  location: faLocationCrosshairs, search: faMagnifyingGlass,
} as const;
export type IconName = keyof typeof ICONS;

// Weather icons get a natural colour; UI icons inherit the text colour.
const TINT: Partial<Record<IconName, string>> = {
  sun: 'text-amber-500', moon: 'text-indigo-400', 'cloud-sun': 'text-amber-500', 'cloud-moon': 'text-indigo-400',
  cloud: 'text-slate-400', smog: 'text-slate-400', 'cloud-rain': 'text-sky-500', 'cloud-showers-heavy': 'text-sky-600',
  'cloud-sun-rain': 'text-sky-500', snowflake: 'text-sky-300', bolt: 'text-yellow-500', droplet: 'text-sky-500',
};

export default function Icon({ name, className = '', label }: { name: IconName | WeatherIconName; className?: string; label?: string }) {
  return (
    <FontAwesomeIcon
      icon={ICONS[name]}
      className={`${TINT[name] ?? ''} ${className}`}
      title={label}
      aria-hidden={label ? undefined : true}
      fixedWidth
    />
  );
}
