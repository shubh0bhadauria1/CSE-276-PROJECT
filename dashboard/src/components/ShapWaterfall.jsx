import React from 'react';
import { FEATURE_LABELS } from '../utils.js';

// Maps slider features to SHAP sensitivity keys
const SLIDER_TO_SHAP = {
  ndvi_delta:       { key: 'NDVI',                   sign: -1 },   // more NDVI → cooler
  impervious_delta: { key: 'Impervious_Surface_Pct', sign: -1 },   // less impervious → cooler
  albedo_delta:     { key: 'Albedo',                 sign: -1 },   // more albedo → cooler
  water_delta:      { key: 'Distance_to_Water_m',    sign: -1 },   // closer water → cooler
};

export default function ShapWaterfall({ sliders, sensitivity }) {
  const contributions = Object.entries(SLIDER_TO_SHAP).map(([sliderKey, { key, sign }]) => {
    const sliderVal = sliders[sliderKey] || 0;
    // scale: sensitivity is per-unit change; apply sign for cooling
    const sens = sensitivity[key] || 0;
    // For NDVI delta (increase), cooling effect = -NDVI_sensitivity * delta
    // For impervious (reduction %), cooling = -sens * delta  etc.
    const contribution = sign * sens * sliderVal;
    return { key, label: FEATURE_LABELS[key] || key, contribution };
  });

  const total = contributions.reduce((s, c) => s + c.contribution, 0);
  const maxAbs = Math.max(0.01, ...contributions.map(c => Math.abs(c.contribution)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {contributions.map(({ key, label, contribution }) => {
        const isCooling = contribution <= 0;
        const pct = Math.abs(contribution) / maxAbs * 100;
        const color = isCooling ? 'var(--primary)' : 'var(--red)';
        const bg    = isCooling ? '#D1FAE5' : '#FEE2E2';

        return (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--body)' }}>
                {label}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color,
                padding: '1px 7px', borderRadius: 999, background: bg }}>
                {contribution <= 0 ? '' : '+'}{contribution.toFixed(3)}°C
              </span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill waterfall-bar"
                style={{ width: `${pct}%`, background: color }} />
            </div>
          </div>
        );
      })}

      {/* Total */}
      <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)' }}>Net ΔT</span>
        <span style={{
          fontSize: 15, fontWeight: 800,
          color: total <= 0 ? 'var(--primary)' : 'var(--red)',
          padding: '3px 12px', borderRadius: 999,
          background: total <= 0 ? '#D1FAE5' : '#FEE2E2',
        }}>
          {total <= 0 ? '' : '+'}{total.toFixed(3)}°C
        </span>
      </div>
    </div>
  );
}
