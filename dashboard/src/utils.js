// Shared utilities & constants

export const FEATURES = [
  'NDVI',
  'Impervious_Surface_Pct',
  'Albedo',
  'Building_Density',
  'Distance_to_Water_m',
  'Ambient_Temp_C',
];

export const FEATURE_LABELS = {
  NDVI:                   'NDVI (Vegetation Index)',
  Impervious_Surface_Pct: 'Impervious Surface %',
  Albedo:                 'Albedo (Reflectivity)',
  Building_Density:       'Building Density',
  Distance_to_Water_m:    'Distance to Water (m)',
  Ambient_Temp_C:         'Ambient Temp (°C)',
  LST:                    'Land Surface Temp (°C)',
};

export const FEATURE_COLORS = {
  NDVI:                   '#10B981',
  Impervious_Surface_Pct: '#EF4444',
  Albedo:                 '#0D9488',
  Building_Density:       '#F59E0B',
  Distance_to_Water_m:    '#6366F1',
  Ambient_Temp_C:         '#F97316',
};

// Cool → Hot temperature colour scale
export function tempToColor(t, min = 32, max = 46) {
  const pct = Math.max(0, Math.min(1, (t - min) / (max - min)));
  if (pct < 0.25) {
    const p = pct / 0.25;
    return `rgb(${lerp(13,16,p)},${lerp(148,185,p)},${lerp(136,129,p)})`;
  } else if (pct < 0.5) {
    const p = (pct - 0.25) / 0.25;
    return `rgb(${lerp(16,245,p)},${lerp(185,158,p)},${lerp(129,11,p)})`;
  } else if (pct < 0.75) {
    const p = (pct - 0.5) / 0.25;
    return `rgb(${lerp(245,239,p)},${lerp(158,68,p)},${lerp(11,68,p)})`;
  } else {
    const p = (pct - 0.75) / 0.25;
    return `rgb(${lerp(239,185,p)},${lerp(68,28,p)},${lerp(68,28,p)})`;
  }
}

function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

export function fmt2(n)   { return typeof n === 'number' ? n.toFixed(2) : '—'; }
export function fmt4(n)   { return typeof n === 'number' ? n.toFixed(4) : '—'; }
export function fmtPct(n) { return typeof n === 'number' ? (n * 100).toFixed(1) + '%' : '—'; }

// Animated counter hook
import { useEffect, useRef, useState } from 'react';
export function useAnimatedNumber(target, decimals = 2, duration = 400) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);
  const raf  = useRef(null);

  useEffect(() => {
    const start = prev.current;
    const end   = target;
    const t0    = performance.now();
    const animate = (now) => {
      const pct = Math.min(1, (now - t0) / duration);
      const ease = 1 - Math.pow(1 - pct, 3);
      setDisplay(start + (end - start) * ease);
      if (pct < 1) raf.current = requestAnimationFrame(animate);
      else { setDisplay(end); prev.current = end; }
    };
    raf.current = requestAnimationFrame(animate);
    return () => raf.current && cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return display.toFixed(decimals);
}
