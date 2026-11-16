import React from 'react';
import { useAnimatedNumber } from '../utils.js';

export default function KpiCard({ icon, label, value, unit = '', sub, accentColor = 'var(--primary)',
  animateKey, decimals = 2, big = false, delay = 0 }) {
  const animated = useAnimatedNumber(typeof value === 'number' ? value : 0, decimals);
  const display  = typeof value === 'number' ? animated : value;

  return (
    <div className="card fade-up" style={{
      padding: '20px 22px', animationDelay: `${delay}ms`,
      borderTop: `3px solid ${accentColor}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 24 }}>{icon}</div>
        {sub && <span className="badge badge-green" style={{ fontSize: 10 }}>{sub}</span>}
      </div>
      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{
            fontSize: big ? 32 : 26, fontWeight: 800, color: accentColor,
            fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em',
            lineHeight: 1,
          }} key={animateKey} className="count-anim">
            {display}
          </span>
          {unit && <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}>{unit}</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}
