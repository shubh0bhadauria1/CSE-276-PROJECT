import React, { useMemo } from 'react';
import { FEATURE_LABELS } from '../utils.js';

function corrColor(val) {
  const abs = Math.abs(val);
  if (val === 1) return { bg: '#1E293B', text: 'white' };
  if (abs > 0.7) return { bg: val > 0 ? '#EF4444' : '#10B981', text: 'white' };
  if (abs > 0.4) return { bg: val > 0 ? '#FCA5A5' : '#6EE7B7', text: '#1F2937' };
  if (abs > 0.2) return { bg: val > 0 ? '#FEE2E2' : '#D1FAE5', text: '#374151' };
  return { bg: '#F8FAFC', text: '#94A3B8' };
}

export default function TabDataQuality({ data }) {
  const dq     = data.data_quality;
  const accept = dq.acceptance;
  const ranges = dq.feature_ranges;
  const corr   = dq.correlation_matrix;
  const cols   = Object.keys(corr);

  const featureCards = [
    { key: 'LST',                   emoji: '🌡️', title: 'Land Surface Temperature',
      desc: 'Target variable. Physically constrained 32–46°C. Derived from impervious coverage, vegetation, albedo, and ambient conditions.',
      color: 'var(--red)' },
    { key: 'NDVI',                  emoji: '🌿', title: 'NDVI — Vegetation Index',
      desc: 'Normalised Difference Vegetation Index (0–1). Higher values indicate denser vegetation and stronger evapotranspirative cooling.',
      color: 'var(--primary)' },
    { key: 'Impervious_Surface_Pct',emoji: '🏗️', title: 'Impervious Surface %',
      desc: 'Fraction of paved/sealed surfaces (0–1). Primary urban heat driver: high thermal mass, low permeability, reduced evaporation.',
      color: 'var(--red)' },
    { key: 'Albedo',                emoji: '☀️', title: 'Albedo (Reflectivity)',
      desc: 'Surface reflectance coefficient (0–1). Higher albedo = more solar radiation reflected = lower LST. Cool roofs target >0.6.',
      color: 'var(--teal)' },
    { key: 'Building_Density',      emoji: '🏙️', title: 'Building Density',
      desc: 'Fraction of area covered by buildings (0–1). Influences anthropogenic heat release, airflow restriction, and sky-view factor.',
      color: 'var(--amber)' },
    { key: 'Distance_to_Water_m',   emoji: '💧', title: 'Distance to Water (m)',
      desc: 'Euclidean distance to nearest water body (11–7991 m). Negative correlation with LST via evaporative cooling and local airflow.',
      color: '#6366F1' },
    { key: 'Ambient_Temp_C',        emoji: '🌤️', title: 'Ambient Temperature (°C)',
      desc: 'Background air temperature (28–38°C). Strong linear driver of LST baseline; independent of land-cover interventions.',
      color: '#F97316' },
  ];

  const acceptItems = [
    { key: 'r2_gt_0.85',       label: 'Best-model R² > 0.85',      format: v => v.toFixed(4) },
    { key: 'rmse_lt_1.5C',     label: 'Best-model RMSE < 1.5°C',   format: v => `${v.toFixed(3)} °C` },
    { key: 'missing_pct_zero', label: 'Missing values = 0%',        format: v => `${v}%` },
    { key: 'min_samples_3500', label: 'Min 3,500 training samples', format: v => `${v.toLocaleString()} rows` },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--heading)',
          fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          🔬 Feature Engineering & Data Quality Pipeline
        </h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          Dataset: <strong>4,000 physically grounded samples</strong> across urban, suburban, and green-zone environments.
          All values loaded from <code>dashboard_data.json → data_quality</code>.
        </p>
      </div>

      {/* Feature Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {featureCards.map((fc, i) => {
          const r = ranges[fc.key];
          return (
            <div key={fc.key} className={`card fade-up`}
              style={{ padding: 16, borderTop: `3px solid ${fc.color}`,
                animationDelay: `${i * 60}ms` }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{fc.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--heading)', marginBottom: 4 }}>
                {fc.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 10 }}>
                {fc.desc}
              </div>
              {r && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, background: 'var(--slate-100)', borderRadius: 6,
                    padding: '2px 7px', color: 'var(--body)' }}>
                    min: {r.min.toFixed(2)}
                  </span>
                  <span style={{ fontSize: 10, background: 'var(--slate-100)', borderRadius: 6,
                    padding: '2px 7px', color: 'var(--body)' }}>
                    max: {r.max.toFixed(2)}
                  </span>
                  <span style={{ fontSize: 10, background: '#D1FAE5', borderRadius: 6,
                    padding: '2px 7px', color: 'var(--primary-dark)', fontWeight: 600 }}>
                    μ: {r.mean.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom row: Acceptance Checklist + Correlation Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 18 }}>

        {/* Acceptance Checklist */}
        <div className="card fade-up-delay2" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)' }}>
              ✅ Acceptance Criteria
            </span>
            {accept.all_pass && (
              <span className="badge badge-primary" style={{ fontSize: 10 }}>ALL PASS</span>
            )}
          </div>

          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {acceptItems.map(ai => {
              const item = accept[ai.key];
              return (
                <div key={ai.key} style={{ display: 'flex', alignItems: 'center',
                  gap: 12, padding: '10px 14px', borderRadius: 8,
                  background: item.pass ? '#F0FDF4' : '#FFF1F2',
                  border: `1px solid ${item.pass ? '#BBF7D0' : '#FECDD3'}` }}>
                  <span style={{ fontSize: 18 }}>{item.pass ? '✅' : '❌'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600,
                      color: item.pass ? '#065F46' : '#9F1239' }}>{ai.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                      {ai.format(item.value)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary stats */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Total Rows', value: dq.total_rows.toLocaleString() },
              { label: 'Missing %', value: `${dq.missing_pct}%` },
              { label: 'Train / Test', value: '3,200 / 800' },
              { label: 'CV Folds', value: '5-fold KFold' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: '8px',
                background: 'var(--slate-100)', borderRadius: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--heading)' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Correlation Matrix Heatmap */}
        <div className="card fade-up-delay3" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)', marginBottom: 14 }}>
            7×7 Feature Correlation Matrix
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: 3, minWidth: 500 }}>
              <thead>
                <tr>
                  <td style={{ width: 110 }} />
                  {cols.map(c => (
                    <td key={c} style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)',
                      textAlign: 'center', padding: '0 2px 6px', maxWidth: 70,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {FEATURE_LABELS[c]?.split(' ')[0] || c}
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cols.map(row => (
                  <tr key={row}>
                    <td style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)',
                      paddingRight: 6, whiteSpace: 'nowrap', textAlign: 'right' }}>
                      {FEATURE_LABELS[row]?.split(' ')[0] || row}
                    </td>
                    {cols.map(col => {
                      const val = corr[row][col];
                      const { bg, text } = corrColor(val);
                      return (
                        <td key={col} title={`${row} ↔ ${col}: ${val.toFixed(4)}`}>
                          <div className="corr-cell" style={{
                            background: bg, color: text,
                            width: 54, height: 44, fontSize: 10,
                          }}>
                            {val.toFixed(2)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14,
            fontSize: 11, color: 'var(--muted)' }}>
            {[
              { color: '#10B981', label: 'Strong negative (cooling)' },
              { color: '#F8FAFC', label: 'No correlation',           border: '1px solid var(--border)' },
              { color: '#EF4444', label: 'Strong positive (heating)' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: l.color,
                  border: l.border || 'none' }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
