import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import TabSimulator from './tabs/TabSimulator.jsx';
import TabModels from './tabs/TabModels.jsx';
import TabDataQuality from './tabs/TabDataQuality.jsx';
import TabScenario from './tabs/TabScenario.jsx';

const TABS = [
  { id: 'simulator',    label: '⚡ Intervention Simulator' },
  { id: 'models',       label: '📊 Model Comparison & SHAP' },
  { id: 'data',         label: '🔬 Data Quality Pipeline' },
  { id: 'scenarios',    label: '📋 Scenario Export' },
];

export default function App() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('simulator');
  const [savedScenarios, setSavedScenarios] = useState([]);

  useEffect(() => {
    fetch('/dashboard_data.json')
      .then(r => r.json())
      .then(setData)
      .catch(console.error);
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
          <div style={{ display: 'flex', gap: 4, padding: '10px 0' }}>
            {TABS.map(t => (
              <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)} style={{ flex: 'none', padding: '9px 20px' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px 48px' }}>
        <div key={activeTab} className="fade-in">
          {activeTab === 'simulator' && <TabSimulator {...tabProps} />}
          {activeTab === 'models'    && <TabModels    {...tabProps} />}
          {activeTab === 'data'      && <TabDataQuality {...tabProps} />}
          {activeTab === 'scenarios' && <TabScenario  {...tabProps} />}
        </div>
      </div>
    </div>
  );
}
