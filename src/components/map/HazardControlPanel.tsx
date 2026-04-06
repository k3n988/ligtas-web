'use client'
// src/components/map/HazardControlPanel.tsx
// Floating admin panel on the map for configuring a hazard event.

import { useState } from 'react'
import { useHazardStore } from '@/store/hazardStore'
import type { HazardEvent } from '@/types'

const HAZARD_TYPES = ['Flood', 'Volcano', 'Earthquake', 'Typhoon', 'Landslide', 'Storm Surge']

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 9px',
  background: '#0d1117',
  border: '1px solid #30363d',
  color: '#fff',
  borderRadius: 4,
  fontSize: '0.78rem',
  fontFamily: 'Inter, sans-serif',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.62rem',
  color: '#8b949e',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: 3,
  fontWeight: 600,
}

const RING_COLORS = {
  critical: '#ff4d4d',
  high:     '#f39c12',
  elevated: '#f1c40f',
  stable:   '#58a6ff',
}

export default function HazardControlPanel() {
  const {
    activeHazard, setActiveHazard,
    isSelectingCenter, setIsSelectingCenter,
    draftCenter, setDraftCenter,
  } = useHazardStore()

  const [open,        setOpen]        = useState(false)
  const [hazardType,  setHazardType]  = useState('Flood')
  const [critical,    setCritical]    = useState('1')
  const [high,        setHigh]        = useState('3')
  const [elevated,    setElevated]    = useState('5')
  const [stable,      setStable]      = useState('10')

  function handlePickCenter() {
    setIsSelectingCenter(true)
    setOpen(false)
  }

  function handleActivate() {
    if (!draftCenter) return
    const hazard: HazardEvent = {
      id:       'HZ-' + Date.now(),
      type:     hazardType,
      center:   draftCenter,
      radii: {
        critical: parseFloat(critical) || 1,
        high:     parseFloat(high)     || 3,
        elevated: parseFloat(elevated) || 5,
        stable:   parseFloat(stable)   || 10,
      },
      isActive: true,
    }
    setActiveHazard(hazard)
    setOpen(false)
  }

  function handleClear() {
    setActiveHazard(null)
    setDraftCenter(null)
    setOpen(false)
  }

  return (
    <div style={{ position: 'absolute', bottom: 80, left: 12, zIndex: 20 }}>

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Hazard Layer Control"
        style={{
          height: 38,
          padding: '0 14px',
          borderRadius: 6,
          background: activeHazard?.isActive ? '#3d1a1a' : '#161b22',
          border: `1.5px solid ${activeHazard?.isActive ? '#da3633' : '#58a6ff'}`,
          color: activeHazard?.isActive ? '#ff4d4d' : '#58a6ff',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: 0.5,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: '0 2px 8px rgba(0,0,0,.5)',
          fontFamily: 'Inter, sans-serif',
          whiteSpace: 'nowrap',
        }}
      >
        ⚠ {activeHazard?.isActive ? `HAZARD: ${activeHazard.type}` : 'HAZARD LAYER'}
      </button>

      {/* Expanded panel */}
      {open && (
        <div style={{
          position: 'absolute',
          bottom: 50, left: 0,
          width: 270,
          background: '#161b22',
          border: '1px solid #30363d',
          borderRadius: 8,
          padding: 14,
          boxShadow: '0 4px 20px rgba(0,0,0,.6)',
          fontFamily: 'Inter, sans-serif',
        }}>
          {/* Header */}
          <div style={{
            fontSize: '0.72rem', fontWeight: 800, color: '#fff',
            textTransform: 'uppercase', letterSpacing: 1,
            borderLeft: '3px solid #ff4d4d', paddingLeft: 8, marginBottom: 12,
          }}>
            ⚠ Hazard Layer
          </div>

          {/* Active hazard badge */}
          {activeHazard?.isActive && (
            <div style={{
              background: '#3d1a1a', border: '1px solid #da3633',
              borderRadius: 4, padding: '6px 10px', marginBottom: 12,
              fontSize: '0.72rem', color: '#ff4d4d', fontWeight: 600,
            }}>
              ACTIVE: {activeHazard.type} — {activeHazard.center.lat.toFixed(4)}, {activeHazard.center.lng.toFixed(4)}
            </div>
          )}

          {/* Disaster type */}
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Disaster Type</label>
            <select value={hazardType} onChange={(e) => setHazardType(e.target.value)} style={inputStyle}>
              {HAZARD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Radii grid */}
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Hazard Radii (km)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {([
                { key: 'critical', label: 'Critical', val: critical, set: setCritical, color: RING_COLORS.critical },
                { key: 'high',     label: 'High',     val: high,     set: setHigh,     color: RING_COLORS.high     },
                { key: 'elevated', label: 'Elevated', val: elevated, set: setElevated, color: RING_COLORS.elevated },
                { key: 'stable',   label: 'Stable',   val: stable,   set: setStable,   color: RING_COLORS.stable   },
              ] as const).map(({ key, label, val, set, color }) => (
                <div key={key}>
                  <label style={{ ...labelStyle, color }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, marginRight: 4 }} />
                    {label}
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={val}
                    onChange={(e) => set(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Center */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Hazard Center</label>
            {draftCenter ? (
              <div style={{
                padding: '6px 9px', background: '#0d2016',
                border: '1px solid #238636', borderRadius: 4,
                fontSize: '0.72rem', color: '#3fb950', fontWeight: 600,
              }}>
                📍 {draftCenter.lat.toFixed(5)}, {draftCenter.lng.toFixed(5)}
              </div>
            ) : (
              <div style={{ fontSize: '0.72rem', color: '#8b949e' }}>No center picked yet</div>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              onClick={handlePickCenter}
              disabled={isSelectingCenter}
              style={{
                padding: '8px', background: '#1f6feb',
                color: '#fff', border: 'none', borderRadius: 4,
                fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', opacity: isSelectingCenter ? 0.6 : 1,
              }}
            >
              📍 Pick Center on Map
            </button>
            <button
              onClick={handleActivate}
              disabled={!draftCenter}
              style={{
                padding: '8px', background: draftCenter ? '#238636' : '#21262d',
                color: draftCenter ? '#fff' : '#8b949e',
                border: 'none', borderRadius: 4,
                fontWeight: 700, fontSize: '0.78rem',
                cursor: draftCenter ? 'pointer' : 'not-allowed',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              ✅ Activate Hazard Layer
            </button>
            {activeHazard && (
              <button
                onClick={handleClear}
                style={{
                  padding: '8px', background: 'transparent',
                  color: '#f85149', border: '1px solid #da3633',
                  borderRadius: 4, fontWeight: 600, fontSize: '0.78rem',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                🗑 Clear Hazard Layer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
