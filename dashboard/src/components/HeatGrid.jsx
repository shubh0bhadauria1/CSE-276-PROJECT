import React, { useMemo } from 'react';
import { tempToColor } from '../utils.js';

const GRID = 10;

function generateZoneTemps(baseline, deltas) {
  // Create a 10x10 grid where each cell has a slightly randomised temperature
  // seeded from zone characteristics (urban core hotter, edges cooler)
  const temps = [];
  for (let r = 0; r < GRID; r++) {
    const row = [];
    for (let c = 0; c < GRID; c++) {
      // Distance from centre (urban core)
      const dr = r - 4.5, dc = c - 4.5;
      const dist = Math.sqrt(dr * dr + dc * dc) / 6.36; // 0–1
      const zoneBase = baseline + (1 - dist) * 3.5; // core up to 3.5°C hotter
      // Add intervention delta
      const seed = ((r * 7 + c * 13) % 100) / 100; // deterministic variation
      const variation = (seed - 0.5) * 0.8;
      row.push(Math.max(32, Math.min(46, zoneBase + deltas + variation)));
    }
    temps.push(row);
  }
  return temps;
}

export default function HeatGrid({ baseline, interventionDelta }) {
  const temps = useMemo(
    () => generateZoneTemps(baseline, interventionDelta),
    [baseline, interventionDelta]
  );

  const globalMin = Math.min(...temps.flat());
  const globalMax = Math.max(...temps.flat());

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID}, 1fr)`, gap: 4 }}>
        {temps.map((row, r) =>
          row.map((temp, c) => {
            const isHot = temp > baseline + 1;
            return (
              <div key={`${r}-${c}`} className={`heat-cell ${isHot ? 'pulsing' : ''}`}
                title={`Zone (${r + 1},${c + 1}): ${temp.toFixed(1)}°C`}
                style={{
                  height: 44,
                  background: tempToColor(temp, 32, 46),
                  opacity: 0.88 + 0.12 * ((temp - globalMin) / (globalMax - globalMin || 1)),
                }}
              />
            );
          })
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>32°C</span>
        <div style={{
          flex: 1, height: 8, borderRadius: 999,
          background: 'linear-gradient(to right, #0D9488, #10B981, #F59E0B, #EF4444, #B91C1C)',
        }} />
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>46°C</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 10, color: 'var(--teal)' }}>● Cooled (Teal)</span>
        <span style={{ fontSize: 10, color: 'var(--red)' }}>● Heat Island (Red)</span>
      </div>
    </div>
  );
}
