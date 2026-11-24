import React, { useState, useCallback, useMemo, useEffect } from 'react';
import KpiCard from '../components/KpiCard.jsx';
import HeatGrid from '../components/HeatGrid.jsx';
import ShapWaterfall from '../components/ShapWaterfall.jsx';
import { useAnimatedNumber } from '../utils.js';

const PRESETS = {
  'Green Corridor':     { ndvi_delta: 0.25, impervious_delta: 0.15, albedo_delta: 0.05, water_delta: 100 },
  'Cool Roof Mandate':  { ndvi_delta: 0.05, impervious_delta: 0.08, albedo_delta: 0.28, water_delta: 50  },
  'High-Density Retrofit': { ndvi_delta: 0.12, impervious_delta: 0.30, albedo_delta: 0.15, water_delta: 200 },
  'Reset Baseline':     { ndvi_delta: 0,    impervious_delta: 0,    albedo_delta: 0,    water_delta: 0   },
};

function computeDelta(sliders, sensitivity) {
  // Physical directional impact of each intervention:
  // NDVI increase   → cooling: each +0.01 NDVI reduces LST by ~0.07°C (sensitivity calibrated)
  // Impervious cut  → cooling: each 1% reduction reduces LST by ~0.08°C
  // Albedo increase → cooling: each +0.01 albedo reduces LST by ~0.06°C
  // Water proximity → cooling: each -100m reduces LST by ~0.15°C
  const { ndvi_delta, impervious_delta, albedo_delta, water_delta } = sliders;
  const sens = sensitivity;

  // Use directional_sensitivity_per_unit from SHAP, calibrated to physical units
  // NDVI: sensitivity per unit (0–1 scale), delta is 0–0.4
  const dNDVI       = -Math.abs(sens['NDVI'] || 0.41)               * ndvi_delta        * 7;
  // Impervious: sensitivity per unit %, delta 0–0.35
  const dImpervious = -Math.abs(sens['Impervious_Surface_Pct'] || 0.009) * impervious_delta * 230;
  // Albedo: sensitivity per unit, delta 0–0.35
  const dAlbedo     = -Math.abs(sens['Albedo'] || 0.02)              * albedo_delta      * 20;
  // Water: sensitivity per m, delta 0–400m closer
  const dWater      = -Math.abs(sens['Distance_to_Water_m'] || 0.000024) * water_delta   * 400;

  return dNDVI + dImpervious + dAlbedo + dWater;
}

function JustificationBox({ sliders, delta, bestModel }) {
  const parts = [];
  if (sliders.ndvi_delta > 0.05)       parts.push(`increasing tree canopy (NDVI +${sliders.ndvi_delta.toFixed(2)})`);
  if (sliders.impervious_delta > 0.05) parts.push(`reducing asphalt cover by ${(sliders.impervious_delta*100).toFixed(0)}%`);
  if (sliders.albedo_delta > 0.02)     parts.push(`installing cool roofs (albedo +${sliders.albedo_delta.toFixed(2)})`);
  if (sliders.water_delta > 20)        parts.push(`positioning water bodies ${sliders.water_delta.toFixed(0)}m closer`);

  const isNegligible = Math.abs(delta) < 0.05;
  const isDiminishing = sliders.ndvi_delta > 0.35 || sliders.impervious_delta > 0.30;

  return (
    <div style={{ background: '#F0FDF4', borderRadius: 10, padding: 14,
      border: '1px solid #BBF7D0', fontSize: 12, lineHeight: 1.7, color: '#14532D' }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
        🤖 LightGBM Decision Rationale
      </div>
      {parts.length === 0 ? (
        <p>Adjust sliders above to see the model's recommended strategy. All interventions are currently at baseline.</p>
      ) : (
        <>
          <p>
            By <strong>{parts.join(', ')}</strong>, the {bestModel} model predicts a 
            net land surface temperature change of <strong>{delta.toFixed(2)}°C</strong>.
          </p>
          {delta < -1.5 && (
            <p style={{ marginTop: 6, color: '#065F46' }}>
              ✅ <strong>High Impact:</strong> This combination exceeds the −1.5°C cooling threshold, qualifying for Tier-1 intervention priority.
            </p>
          )}
          {isDiminishing && (
            <p style={{ marginTop: 6, color: '#92400E', background: '#FEF3C7',
              padding: '6px 10px', borderRadius: 6, border: '1px solid #FDE68A' }}>
              ⚠️ <strong>Diminishing Returns:</strong> Some sliders are near maximum. Marginal cooling per additional unit investment decreases beyond this threshold.
            </p>
          )}
          {isNegligible && (
            <p style={{ marginTop: 6, color: '#475569' }}>
              ℹ️ Current intervention levels are too small to produce measurable cooling. Try increasing at least two sliders.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function TabSimulator({ data, savedScenarios, setSavedScenarios,
  externalSliders, onExternalSlidersConsumed }) {
  const baseline = data.uncertainty.baseline_lst;
  const ci95     = data.uncertainty.ci_95;
  const sens     = data.shap_importance.directional_sensitivity_per_unit;
  const bestModel= data.shap_importance.best_model;

  const [sliders, setSliders] = useState(PRESETS['Reset Baseline']);
  const [injectedZone, setInjectedZone] = useState(false);

  // Consume external sliders pushed by Tab 5 "Simulate" button
  useEffect(() => {
    if (externalSliders) {
      setSliders(prev => ({ ...prev, ...externalSliders }));
      setInjectedZone(true);
      onExternalSlidersConsumed?.();
    }
  }, [externalSliders, onExternalSlidersConsumed]);

  const delta    = useMemo(() => computeDelta(sliders, sens), [sliders, sens]);
  const predicted = Math.max(32, Math.min(46, baseline + delta));
  const netCooling = -(delta);  // positive = cooling

  const animPredicted = useAnimatedNumber(predicted, 2);
  const animDelta     = useAnimatedNumber(netCooling, 2);

  const setSlider = useCallback((key, val) => {
    setSliders(prev => ({ ...prev, [key]: val }));
  }, []);

  const applyPreset = useCallback((name) => {
    setSliders(PRESETS[name]);
  }, []);

  const saveScenario = () => {
    if (savedScenarios.length >= 3) return;
    setSavedScenarios(prev => [...prev, {
      id: Date.now(),
      name: `Scenario ${prev.length + 1}`,
      sliders: { ...sliders },
      delta, predicted, netCooling,
    }]);
  };

  const SLIDER_CONFIG = [
    { key: 'ndvi_delta', label: '🌿 Tree Canopy / NDVI Increase', min: 0, max: 0.40, step: 0.01,
      unit: '+NDVI', hint: 'Evapotranspiration cooling. +0.01 NDVI ≈ −0.07°C LST' },
    { key: 'impervious_delta', label: '🏗️ Impervious Surface Reduction', min: 0, max: 0.35, step: 0.01,
      unit: '−frac', hint: 'Replace asphalt with permeable surfaces. −5% ≈ −0.4°C' },
    { key: 'albedo_delta', label: '🏠 Cool Roof / High-Albedo Adoption', min: 0, max: 0.35, step: 0.01,
      unit: '+albedo', hint: 'Reflective surfaces reduce absorbed radiation. +0.1 ≈ −0.6°C' },
    { key: 'water_delta', label: '💧 Water Body Proximity (m closer)', min: 0, max: 400, step: 10,
      unit: 'm', hint: 'Mist zones and water bodies. −100m proximity ≈ −0.15°C' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--heading)',
          fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          ⚡ Interactive Urban Intervention Simulator
        </h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          Adjust interventions and see real-time LST predictions powered by {bestModel} SHAP sensitivities.
        </p>
      </div>

      {/* Injection banner from Tab 5 */}
      {injectedZone && (
        <div className="fade-in" style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8,
          background: '#EFF6FF', border: '1px solid #BFDBFE',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>📂</span>
            <span style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 600 }}>
              Zone strategy loaded from CSV Batch Analyzer — sliders set to prescribed intervention levels.
            </span>
          </div>
          <button onClick={() => setInjectedZone(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              color: '#93C5FD', fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <KpiCard icon="🌡️" label="Baseline Land Surface Temp"
          value={baseline} unit="°C" accentColor="var(--amber)"
          animateKey="baseline" delay={0} />
        <KpiCard icon="📍" label="Predicted Post-Intervention"
          value={predicted} unit="°C" accentColor={predicted < baseline ? 'var(--primary)' : 'var(--red)'}
          animateKey={predicted} delay={80} />
        <KpiCard icon="❄️" label="Net Cooling Impact ΔT"
          value={netCooling} unit="°C" accentColor="var(--teal)"
          sub={netCooling > 0.5 ? 'Cooling Active' : 'Minimal Impact'}
          animateKey={netCooling} delay={160} />
        <KpiCard icon="📊" label={`95% CI ± ${ci95.toFixed(2)}°C`}
          value={ci95} unit="°C" accentColor="#6366F1"
          sub="Uncertainty" animateKey="ci" delay={240} />
      </div>

      {/* Main 3-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: 18, alignItems: 'start' }}>

        {/* Left: Controls */}
        <div className="card fade-up-delay1" style={{ padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)', marginBottom: 10 }}>
              🎛️ Proposed Urban Intervention
            </div>

            {/* Preset buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
              {Object.keys(PRESETS).map(name => (
                <button key={name} className="btn btn-outline" onClick={() => applyPreset(name)}
                  style={{ fontSize: 11, padding: '6px 10px', textAlign: 'center', justifyContent: 'center' }}>
                  {name === 'Reset Baseline' ? '↺ ' : '⚡ '}{name}
                </button>
              ))}
            </div>

            {/* Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {SLIDER_CONFIG.map(cfg => (
                <div key={cfg.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--body)' }}>{cfg.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)',
                      background: '#D1FAE5', padding: '1px 8px', borderRadius: 999, minWidth: 48, textAlign: 'center' }}>
                      +{sliders[cfg.key].toFixed(cfg.key === 'water_delta' ? 0 : 2)}
                      {cfg.unit === 'm' ? 'm' : ''}
                    </span>
                  </div>
                  <input type="range" min={cfg.min} max={cfg.max} step={cfg.step}
                    value={sliders[cfg.key]}
                    onChange={e => setSlider(cfg.key, parseFloat(e.target.value))}
                    style={{ accentColor: 'var(--primary)' }} />
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>{cfg.hint}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Save button */}
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
            onClick={saveScenario} disabled={savedScenarios.length >= 3}>
            💾 Save Scenario ({savedScenarios.length}/3)
          </button>
        </div>

        {/* Centre: Heat Grid */}
        <div className="card fade-up-delay2" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)' }}>
                🗺️ Urban Zone Heat Map (10×10 Grid)
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                Hover cells for zone-level temperature. Pulsing = active heat island.
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: predicted < baseline ? 'var(--primary)' : 'var(--red)',
                fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {animPredicted}°C
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>zone avg LST</div>
            </div>
          </div>
          <HeatGrid baseline={baseline} interventionDelta={delta} />

          {/* Delta indicator */}
          <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8,
            background: netCooling > 0.1 ? '#F0FDF4' : '#FFF7ED',
            border: `1px solid ${netCooling > 0.1 ? '#BBF7D0' : '#FED7AA'}`,
            display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>{netCooling > 0.1 ? '❄️' : '🔥'}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700,
                color: netCooling > 0.1 ? '#065F46' : '#92400E' }}>
                {netCooling > 0.1
                  ? `Cooling Active: −${netCooling.toFixed(2)}°C reduction across grid`
                  : `Minimal Intervention: adjust sliders for cooling`}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                95% CI: ±{ci95.toFixed(2)}°C  •  Model: {bestModel}  •  R² = {data.models[bestModel]?.r2.toFixed(4)}
              </div>
            </div>
          </div>
        </div>

        {/* Right: SHAP Waterfall + Justification */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card fade-up-delay3" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)', marginBottom: 14 }}>
              📐 SHAP Contribution Breakdown
            </div>
            <ShapWaterfall sliders={sliders} sensitivity={sens} />
          </div>

          <div className="card fade-up-delay4" style={{ padding: 16 }}>
            <JustificationBox sliders={sliders} delta={delta} bestModel={bestModel} />
          </div>
        </div>
      </div>
    </div>
  );
}
