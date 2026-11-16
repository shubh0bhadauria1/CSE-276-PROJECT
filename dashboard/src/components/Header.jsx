import React from 'react';

export default function Header() {
  return (
    <header style={{
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0D3D2E 100%)',
      color: 'white', padding: '0 24px',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '18px 0 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        
        {/* Left: Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'linear-gradient(135deg, #10B981, #0D9488)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>🌡️</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2,
              fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em' }}>
              Urban Heat Mitigation & Cooling Strategy
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2, fontWeight: 500 }}>
              Decision Support Tool — Powered by LightGBM + XAI
            </div>
          </div>
        </div>

        {/* Right: Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'SIH 2026', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
            { label: 'CSE 276',  color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
            { label: 'CO3 • CO4 • CO5', color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
            { label: 'XAI Enabled', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
          ].map(b => (
            <span key={b.label} style={{
              padding: '4px 10px', borderRadius: 999,
              background: b.bg, color: b.color,
              fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
              border: `1px solid ${b.color}30`,
            }}>{b.label}</span>
          ))}
        </div>
      </div>

      {/* Sub-info bar */}
      <div style={{ maxWidth: 1400, margin: '0 auto',
        borderTop: '1px solid rgba(255,255,255,0.08)', padding: '8px 0',
        display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {[
          { icon: '🤖', label: 'Best Model: LightGBM', value: 'R² = 0.9823' },
          { icon: '📍', label: 'Dataset', value: '4,000 urban samples' },
          { icon: '🎯', label: 'Target', value: 'LST 32–46 °C' },
          { icon: '✅', label: 'Acceptance', value: 'All 4 criteria PASS' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>{item.icon}</span>
            <span style={{ fontSize: 11, color: '#94A3B8' }}>{item.label}:</span>
            <span style={{ fontSize: 11, color: '#E2E8F0', fontWeight: 600 }}>{item.value}</span>
          </div>
        ))}
      </div>
    </header>
  );
}
