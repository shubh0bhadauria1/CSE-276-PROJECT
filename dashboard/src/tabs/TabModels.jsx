import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine, Legend,
} from 'recharts';
import { FEATURE_LABELS, FEATURE_COLORS } from '../utils.js';

const MODEL_COLORS = {
  Ridge:          '#6366F1',
  'Random Forest':'#F59E0B',
  XGBoost:        '#EF4444',
  LightGBM:       '#10B981',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color || 'white', fontSize: 12 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(4) : p.value}
        </div>
      ))}
    </div>
  );
};

export default function TabModels({ data }) {
  const models     = data.models;
  const shap       = data.shap_importance;
  const pd         = shap.partial_dependence;
  const [selectedPD, setSelectedPD] = useState('NDVI');

  // Model comparison table data
  const modelRows = Object.entries(models).map(([name, m]) => ({ name, ...m }));

  // Grouped bar chart data
  const barData = [
    { metric: 'R²',       ...Object.fromEntries(modelRows.map(r => [r.name, r.r2])) },
    { metric: 'RMSE',     ...Object.fromEntries(modelRows.map(r => [r.name, r.rmse])) },
    { metric: 'MAE',      ...Object.fromEntries(modelRows.map(r => [r.name, r.mae])) },
    { metric: 'CV RMSE',  ...Object.fromEntries(modelRows.map(r => [r.name, r.cv_rmse])) },
  ];

  // SHAP importance data
  const shapData = Object.entries(shap.mean_abs_shap)
    .sort((a, b) => b[1] - a[1])
    .map(([feat, val]) => ({
      feature: FEATURE_LABELS[feat] || feat,
      value: val,
      color: FEATURE_COLORS[feat] || '#6366F1',
    }));

  const maxShap = Math.max(...shapData.map(d => d.value));

  // PD curve data
  const pdCurve = pd[selectedPD];
  const pdData  = pdCurve ? pdCurve.grid.map((g, i) => ({
    x: parseFloat(g.toFixed(3)),
    LST: parseFloat(pdCurve.avg[i].toFixed(3)),
  })) : [];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--heading)',
          fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          📊 Model Comparison & Global SHAP Explainability
        </h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          All metrics loaded directly from <code>dashboard_data.json</code> → <code>models</code> and <code>shap_importance</code>.
        </p>
      </div>

      {/* Top row: Table + Bar Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>

        {/* Model Benchmark Table */}
        <div className="card fade-up" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)' }}>
              Model Benchmark Results
            </span>
            <span className="badge badge-primary">4 Models Trained</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>R²</th>
                <th>RMSE °C</th>
                <th>MAE °C</th>
                <th>CV RMSE</th>
              </tr>
            </thead>
            <tbody>
              {modelRows.map(row => (
                <tr key={row.name} className={row.is_best ? 'highlight' : ''}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%',
                        background: MODEL_COLORS[row.name] }} />
                      <span style={{ fontWeight: row.is_best ? 700 : 400 }}>{row.name}</span>
                      {row.is_best && (
                        <span className="badge badge-primary" style={{ fontSize: 9 }}>★ Best</span>
                      )}
                    </div>
                  </td>
                  <td style={{ color: row.r2 > 0.95 ? 'var(--primary)' : 'var(--body)',
                    fontWeight: row.is_best ? 700 : 400 }}>
                    {row.r2.toFixed(4)}
                  </td>
                  <td>{row.rmse.toFixed(4)}</td>
                  <td>{row.mae.toFixed(4)}</td>
                  <td>{row.cv_rmse.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Grouped Bar Chart */}
        <div className="card fade-up-delay1" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)', marginBottom: 14 }}>
            Comparative Metric Chart
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="metric" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              {Object.keys(MODEL_COLORS).map(name => (
                <Bar key={name} dataKey={name} fill={MODEL_COLORS[name]}
                  radius={[3,3,0,0]} maxBarSize={18} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row: SHAP + PD Curve */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* SHAP Global Importance */}
        <div className="card fade-up-delay2" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)' }}>
              Global SHAP Feature Importance
            </div>
            <span className="badge badge-green">Best Model: {shap.best_model}</span>
          </div>

          {shapData.map(({ feature, value, color }) => (
            <div key={feature} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--body)' }}>{feature}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color,
                  padding: '1px 8px', borderRadius: 999,
                  background: color + '18' }}>
                  {value.toFixed(4)}
                </span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill"
                  style={{ width: `${(value / maxShap) * 100}%`, background: color }} />
              </div>
            </div>
          ))}

          <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--slate-100)',
            borderRadius: 8, fontSize: 11, color: 'var(--muted)' }}>
            Mean |SHAP| value = average absolute SHAP contribution across 800 test samples.
            Higher = more influential on LST prediction.
          </div>
        </div>

        {/* Partial Dependence Curve */}
        <div className="card fade-up-delay3" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)' }}>
              Partial Dependence Curve
            </div>
            <select value={selectedPD} onChange={e => setSelectedPD(e.target.value)}
              style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, fontFamily: 'var(--font-sans)',
                border: '1px solid var(--border)', color: 'var(--body)', background: 'white', cursor: 'pointer' }}>
              {Object.keys(pd).map(f => (
                <option key={f} value={f}>{FEATURE_LABELS[f] || f}</option>
              ))}
            </select>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={pdData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="x" tick={{ fontSize: 10, fill: 'var(--muted)' }}
                label={{ value: FEATURE_LABELS[selectedPD] || selectedPD, position: 'insideBottom',
                  offset: -2, fontSize: 10, fill: 'var(--muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }}
                label={{ value: 'Avg LST (°C)', angle: -90, position: 'insideLeft',
                  offset: 10, fontSize: 10, fill: 'var(--muted)' }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={data.uncertainty.baseline_lst} stroke="var(--amber)"
                strokeDasharray="4 4" label={{ value: 'Baseline', fontSize: 10, fill: 'var(--amber)' }} />
              <Line type="monotone" dataKey="LST" stroke={FEATURE_COLORS[selectedPD] || 'var(--primary)'}
                strokeWidth={2.5} dot={false} name="Avg Predicted LST" />
            </LineChart>
          </ResponsiveContainer>

          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--muted)',
            padding: '8px 12px', background: 'var(--slate-100)', borderRadius: 8 }}>
            Partial dependence shows the marginal effect of <strong>{FEATURE_LABELS[selectedPD]}</strong> on LST,
            averaged over all other features (20 grid points, 5th–95th percentile range).
          </div>
        </div>
      </div>
    </div>
  );
}
