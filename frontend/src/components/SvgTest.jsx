import React from 'react';

// Minimal test component to verify SVG rendering in your React environment
export default function SvgTest() {
  return (
    <div style={{ padding: 32 }}>
      <h2>SVG Render Test</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #ddd', padding: 16 }}>
        <span style={{ display: 'inline-flex', width: 40, height: 40, alignItems: 'center', justifyContent: 'center', background: '#f0f4ff', borderRadius: 8 }}>
          <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="13" stroke="#3b82f6" strokeWidth="2" fill="#eff6ff" />
            <path d="M14 18c-3 0-5-1.5-5-3.5S11 11 14 11s5 1.5 5 3.5S17 18 14 18z" fill="#3b82f6" />
            <circle cx="14" cy="9" r="2" fill="#3b82f6" />
          </svg>
        </span>
        <span style={{ fontSize: 18, color: '#222' }}>If you see a blue icon to the left, SVG rendering works!</span>
      </div>
    </div>
  );
}
