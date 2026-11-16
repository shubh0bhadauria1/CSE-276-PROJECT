import React, { useState } from 'react';

const FEATURE_LABELS = {
  ndvi_delta:       'NDVI Increase',
  impervious_delta: 'Impervious Reduction',
  albedo_delta:     'Albedo Increase',
  water_delta:      'Water Proximity (m)',
};

function ScenarioCard({ scenario, index, onRemove }) {
  const { name, sliders, delta, predicted, netCooling } = scenario;
  const isCooling = netCooling > 0;

  return (
    <div className="scenario-slot filled fade-up" style={{ animationDelay: `${index * 80}ms` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        width: '100%', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)' }}>{name}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            Saved scenario #{index + 1}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            fontSize: 15, fontWeight: 800,
            color: isCooling ? 'var(--primary)' : 'var(--red)',
            padding: '3px 10px', borderRadius: 999,
            background: isCooling ? '#D1FAE5' : '#FEE2E2',
          }}>
            {isCooling ? '−' : '+'}{Math.abs(netCooling).toFixed(2)}°C
          </span>
          <button onClick={() => onRemove(scenario.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontSize: 16, padding: '2px 4px',
            borderRadius: 4, lineHeight: 1,
          }} title="Remove scenario">×</button>
        </div>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Object.entries(sliders).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between',
            fontSize: 11, color: 'var(--body)' }}>
            <span style={{ color: 'var(--muted)' }}>{FEATURE_LABELS[k] || k}</span>
            <span style={{ fontWeight: 600 }}>
              +{k === 'water_delta' ? v.toFixed(0) + 'm' : v.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div style={{ width: '100%', marginTop: 10, paddingTop: 10,
        borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: isCooling ? 'var(--primary)' : 'var(--red)' }}>
            {predicted.toFixed(2)}°C
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>Predicted LST</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--heading)' }}>
            {netCooling > 0 ? (netCooling / (Object.values(sliders).reduce((a, b) => a + b, 0.001))).toFixed(3) : '—'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>°C / unit effort</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700,
            color: netCooling > 1.5 ? 'var(--primary)' : netCooling > 0.5 ? 'var(--amber)' : 'var(--red)' }}>
            {netCooling > 1.5 ? 'High' : netCooling > 0.5 ? 'Med' : 'Low'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>Priority</div>
        </div>
      </div>
    </div>
  );
}

function EmptySlot({ index }) {
  return (
    <div className="scenario-slot" style={{ animationDelay: `${index * 80}ms` }}>
      <div style={{ fontSize: 32, opacity: 0.3 }}>+</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
        Save a scenario from the<br />Intervention Simulator tab
      </div>
    </div>
  );
}

export default function TabScenario({ data, savedScenarios, setSavedScenarios }) {
  const [nameMap, setNameMap] = useState({});

  const removeScenario = (id) => {
    setSavedScenarios(prev => prev.filter(s => s.id !== id));
  };

  const renameScenario = (id, newName) => {
    setSavedScenarios(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s));
  };

  const exportJSON = () => {
    const exportData = {
      export_timestamp: new Date().toISOString(),
      tool: 'Urban Heat Mitigation Decision Tool — SIH 2026',
      best_model: data.shap_importance.best_model,
      baseline_lst: data.uncertainty.baseline_lst,
      ci_95: data.uncertainty.ci_95,
      scenarios: savedScenarios.map(s => ({
        name: s.name,
        interventions: s.sliders,
        predicted_lst: parseFloat(s.predicted.toFixed(3)),
        net_cooling_delta_C: parseFloat(s.netCooling.toFixed(3)),
        priority: s.netCooling > 1.5 ? 'High' : s.netCooling > 0.5 ? 'Medium' : 'Low',
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'cooling_strategy_report.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ['Scenario','NDVI_delta','Impervious_delta','Albedo_delta','Water_delta_m',
                     'Predicted_LST','Net_Cooling_C','Priority'];
    const rows = savedScenarios.map(s => [
      s.name, s.sliders.ndvi_delta, s.sliders.impervious_delta,
      s.sliders.albedo_delta, s.sliders.water_delta,
      s.predicted.toFixed(3), s.netCooling.toFixed(3),
      s.netCooling > 1.5 ? 'High' : s.netCooling > 0.5 ? 'Medium' : 'Low',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'cooling_strategy_report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const best = savedScenarios.length > 0
    ? savedScenarios.reduce((a, b) => a.netCooling > b.netCooling ? a : b)
    : null;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--heading)',
          fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          📋 Scenario Comparison & Export Report
        </h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          Save up to 3 simulated strategies from the Intervention Simulator, compare their
          cost-to-cooling efficiency, then export a JSON/CSV decision summary.
        </p>
      </div>

      {/* Scenario Slots */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[0, 1, 2].map(i => {
          const s = savedScenarios[i];
          return s
            ? <ScenarioCard key={s.id} scenario={s} index={i} onRemove={removeScenario} />
            : <EmptySlot key={i} index={i} />;
        })}
      </div>

      {/* Comparison table (shown only when ≥2 scenarios saved) */}
      {savedScenarios.length >= 2 && (
        <div className="card fade-up" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)' }}>
              Side-by-Side Comparison
            </span>
            {best && (
              <span className="badge badge-primary">
                ★ Recommended: {best.name}
              </span>
            )}
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Metric</th>
                {savedScenarios.map(s => <th key={s.id}>{s.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Predicted LST', fmt: s => `${s.predicted.toFixed(2)}°C` },
                { label: 'Net Cooling ΔT', fmt: s => `−${s.netCooling.toFixed(2)}°C` },
                { label: 'NDVI Increase', fmt: s => `+${s.sliders.ndvi_delta.toFixed(2)}` },
                { label: 'Impervious Cut', fmt: s => `−${(s.sliders.impervious_delta*100).toFixed(1)}%` },
                { label: 'Albedo Increase', fmt: s => `+${s.sliders.albedo_delta.toFixed(2)}` },
                { label: 'Water Proximity', fmt: s => `−${s.sliders.water_delta.toFixed(0)}m` },
                { label: 'Efficiency (°C/unit)', fmt: s => {
                  const effort = Object.values(s.sliders).reduce((a, b) => a + b, 0.001);
                  return (s.netCooling / effort).toFixed(3);
                }},
                { label: 'Priority', fmt: s =>
                  s.netCooling > 1.5 ? '🟢 High' : s.netCooling > 0.5 ? '🟡 Medium' : '🔴 Low' },
              ].map(row => (
                <tr key={row.label}>
                  <td style={{ fontWeight: 600, color: 'var(--body)' }}>{row.label}</td>
                  {savedScenarios.map(s => (
                    <td key={s.id}
                      className={best && s.id === best.id && row.label === 'Net Cooling ΔT' ? 'highlight' : ''}>
                      {row.fmt(s)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Export Buttons */}
      <div className="card fade-up-delay2" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)', marginBottom: 14 }}>
          📤 Export Decision Summary
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={exportJSON}
            disabled={savedScenarios.length === 0}
            style={{ opacity: savedScenarios.length === 0 ? 0.5 : 1 }}>
            ⬇️ Export JSON Report
          </button>
          <button className="btn btn-outline" onClick={exportCSV}
            disabled={savedScenarios.length === 0}
            style={{ opacity: savedScenarios.length === 0 ? 0.5 : 1 }}>
            📊 Export CSV Report
          </button>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            {savedScenarios.length === 0
              ? 'Save at least one scenario to enable export.'
              : `${savedScenarios.length} scenario(s) ready to export.`}
          </span>
        </div>

        {/* Reference info */}
        <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--slate-100)',
          borderRadius: 8, fontSize: 11, color: 'var(--muted)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--body)' }}>Export includes:</strong> scenario name,
          all intervention levels (NDVI, impervious, albedo, water proximity), predicted LST,
          net cooling ΔT, cost-efficiency ratio, and priority classification.
          Model: {data.shap_importance.best_model} (R² = {data.models[data.shap_importance.best_model]?.r2.toFixed(4)}).
          Baseline LST: {data.uncertainty.baseline_lst.toFixed(2)}°C.
          95% CI: ±{data.uncertainty.ci_95.toFixed(3)}°C.
        </div>
      </div>
    </div>
  );
}
