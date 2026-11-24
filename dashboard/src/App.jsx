import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header.jsx';
import TabSimulator from './tabs/TabSimulator.jsx';
import TabModels from './tabs/TabModels.jsx';
import TabDataQuality from './tabs/TabDataQuality.jsx';
import TabScenario from './tabs/TabScenario.jsx';
import TabBatchAnalyzer from './tabs/TabBatchAnalyzer.jsx';

const TABS = [
  { id: 'simulator', label: '⚡ Intervention Simulator' },
  { id: 'models',    label: '📊 Model Comparison & SHAP' },
  { id: 'data',      label: '🔬 Data Quality Pipeline' },
  { id: 'scenarios', label: '📋 Scenario Export' },
  { id: 'batch',     label: '📂 CSV Batch Analyzer' },
];

export default function App() {
  const [data, setData]                   = useState(null);
  const [activeTab, setActiveTab]         = useState('simulator');
  const [savedScenarios, setSavedScenarios] = useState([]);
  // Shared slider state — lifted so Tab 5 can push to Tab 1
  const [simulatorSliders, setSimulatorSliders] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}dashboard_data.json`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  // Called by Tab 5 "Simulate" button — switches to Tab 1 and injects sliders
  const handleSimulate = useCallback((sliders) => {
    setSimulatorSliders(sliders);
    setActiveTab('simulator');
  }, []);

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', flexDirection: 'column', gap: 20 }}>
      <div className="spinner" />
      <p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading Urban Heat Dashboard…</p>
    </div>
  );

  const tabProps = { data, savedScenarios, setSavedScenarios };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header />

      {/* Tab Navigation */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 100, boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', gap: 2, padding: '10px 0', overflowX: 'auto' }}>
            {TABS.map(t => (
              <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
                style={{ flex: 'none', padding: '9px 18px', whiteSpace: 'nowrap' }}>
                {t.label}
                {t.id === 'batch' && (
                  <span style={{ marginLeft: 6, fontSize: 10, background: '#D1FAE5',
                    color: 'var(--primary)', padding: '1px 6px', borderRadius: 999,
                    fontWeight: 700 }}>NEW</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px 48px' }}>
        <div key={activeTab} className="fade-in">
          {activeTab === 'simulator' && (
            <TabSimulator {...tabProps}
              externalSliders={simulatorSliders}
              onExternalSlidersConsumed={() => setSimulatorSliders(null)} />
          )}
          {activeTab === 'models'    && <TabModels    {...tabProps} />}
          {activeTab === 'data'      && <TabDataQuality {...tabProps} />}
          {activeTab === 'scenarios' && <TabScenario  {...tabProps} />}
          {activeTab === 'batch'     && (
            <TabBatchAnalyzer {...tabProps} onSimulate={handleSimulate} />
          )}
        </div>
      </div>
    </div>
  );
}
