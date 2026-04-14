'use client'
// src/components/map/HazardControlPanel.tsx
import { useMap } from '@vis.gl/react-google-maps'
import { type ReactNode, useEffect, useState } from 'react'
import { useHazardStore } from '@/store/hazardStore'
import { useAuthStore } from '@/store/authStore'
import type { FloodDepth, FloodSeverity, FloodZone, HazardEvent } from '@/types'
import FloodDrawingManager from './FloodDrawingManager'

const HAZARD_TYPES = ['Flood', 'Volcano', 'Earthquake', 'Typhoon', 'Landslide', 'Storm Surge']

const SEVERITY_COLOR: Record<FloodSeverity, string> = {
  critical: '#ff4d4d',
  high:     '#f39c12',
  elevated: '#f1c40f',
  stable:   '#58a6ff',
}

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

interface HazardControlPanelProps {
  topControls?: ReactNode
  forceHazardType?: string | null
}

export default function HazardControlPanel({ topControls, forceHazardType }: HazardControlPanelProps) {
  const {
    activeHazard,
    setActiveHazard,
    clearHazard,
    isSelectingCenter,
    setIsSelectingCenter,
    draftCenter,
    floodZones,
    draftFloodZones,
    addDraftFloodZone,
    removeDraftFloodZone,
    deleteFloodZone,
  } = useHazardStore()

  const user = useAuthStore((s) => s.user)
  const map  = useMap()

  // ── Panel open/close ──────────────────────────────────────────────────
  const [open, setOpen] = useState(false)

  // ── Volcano state ─────────────────────────────────────────────────────
  const [hazardType, setHazardType] = useState(() => activeHazard?.type ?? 'Flood')
  const [critical,   setCritical]   = useState(() => String(activeHazard?.radii.critical ?? 1))
  const [high,       setHigh]       = useState(() => String(activeHazard?.radii.high     ?? 3))
  const [elevated,   setElevated]   = useState(() => String(activeHazard?.radii.elevated ?? 5))
  const [stable,     setStable]     = useState(() => String(activeHazard?.radii.stable   ?? 10))

  // ── Flood drawing state ───────────────────────────────────────────────
  const [isDrawing,      setIsDrawing]      = useState(false)
  const [pendingPolygon, setPendingPolygon] = useState<Array<{ lat: number; lng: number }> | null>(null)
  const [draftSeverity,  setDraftSeverity]  = useState<FloodSeverity>('stable')
  const [draftDepth,     setDraftDepth]     = useState<FloodDepth | ''>('')
  const [draftNotes,     setDraftNotes]     = useState('')

  useEffect(() => {
    if (!forceHazardType || hazardType === forceHazardType) return
    setHazardType(forceHazardType)
    setPendingPolygon(null)
    setIsDrawing(false)
  }, [forceHazardType, hazardType])

  // Early return AFTER all hooks
  if (!activeHazard?.isActive && user?.role !== 'admin') return null

  // ── Handlers ──────────────────────────────────────────────────────────

  function handlePickCenter() {
    setIsSelectingCenter(true)
    setOpen(false)
  }

  function handlePolygonComplete(coords: Array<{ lat: number; lng: number }>) {
    setPendingPolygon(coords)
    setIsDrawing(false)
  }

  function handleAddZone() {
    if (!pendingPolygon || pendingPolygon.length < 3) return
    const zone: FloodZone = {
      id:       'FZ-' + Date.now(),
      severity: draftSeverity,
      depth:    draftDepth || undefined,
      notes:    draftNotes.trim() || undefined,
      polygon:  pendingPolygon,
    }
    addDraftFloodZone(zone)
    setPendingPolygon(null)
    setDraftSeverity('stable')
    setDraftDepth('')
    setDraftNotes('')
  }

  async function handleActivate() {
    if (hazardType === 'Flood') {
      if (draftFloodZones.length === 0 && floodZones.length === 0) return
      const hazard: HazardEvent = {
        id:       'HZ-' + Date.now(),   // DB will return real id; store uses that for FK
        type:     'Flood',
        center:   { lat: 0, lng: 0 },
        radii:    { critical: 0, high: 0, elevated: 0, stable: 0 },
        isActive: true,
      }
      await setActiveHazard(hazard)
    } else {
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
      await setActiveHazard(hazard)
    }
    setOpen(false)
  }

  async function handleClear() {
    await clearHazard()
    setPendingPolygon(null)
    setIsDrawing(false)
    setOpen(false)
  }

  // ── Derived ───────────────────────────────────────────────────────────
  const isFlood       = hazardType === 'Flood'
  const canActivate   = isFlood
    ? (draftFloodZones.length > 0 || floodZones.length > 0)
    : !!draftCenter

  function quickSelectHazard(nextType: string) {
    setHazardType(nextType)
    setPendingPolygon(null)
    setIsDrawing(false)
    setOpen(true)

    if (activeHazard?.isActive && map && activeHazard.type === nextType && activeHazard.type !== 'Flood') {
      map.panTo(activeHazard.center)
      map.setZoom(12)
    }
  }

  return (
    <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>

      {/* ── Drawing manager (mounts only when drawing) ─────────────────── */}
      <FloodDrawingManager active={isDrawing} onPolygonComplete={handlePolygonComplete} />

      {/* ── Toggle button ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
        <button
          onClick={() => {
            setOpen((o) => !o)
            if (activeHazard?.isActive && map && activeHazard.type !== 'Flood') {
              map.panTo(activeHazard.center)
              map.setZoom(12)
            }
          }}
          title="Hazard Layer Control"
          style={{
            height: 38,
            padding: '0 14px',
            borderRadius: 6,
            background: activeHazard?.isActive ? '#3d1a1a' : (user?.role === 'admin' ? '#161b22' : 'transparent'),
            border: `1.5px solid ${activeHazard?.isActive ? '#da3633' : '#58a6ff'}`,
            color: activeHazard?.isActive ? '#ff4d4d' : '#58a6ff',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: 0.5,
            cursor: (activeHazard?.isActive || user?.role === 'admin') ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,.5)',
            fontFamily: 'Inter, sans-serif',
            whiteSpace: 'nowrap',
            pointerEvents: (!activeHazard?.isActive && user?.role !== 'admin') ? 'none' : 'auto',
            opacity: (!activeHazard?.isActive && user?.role !== 'admin') ? 0 : 1,
          }}
        >
          ⚠ {activeHazard?.isActive ? `ACTIVE: ${activeHazard.type}` : 'HAZARD LAYER'}
        </button>

        <button
          onClick={() => quickSelectHazard('Volcano')}
          title="Configure volcano hazard"
          style={{
            height: 38,
            padding: '0 14px',
            borderRadius: 6,
            background: hazardType === 'Volcano' ? '#3d2412' : '#161b22',
            border: `1.5px solid ${hazardType === 'Volcano' ? '#f39c12' : '#58a6ff'}`,
            color: hazardType === 'Volcano' ? '#f39c12' : '#58a6ff',
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
          Volcano
        </button>

        <button
          onClick={() => quickSelectHazard('Earthquake')}
          title="Configure earthquake hazard"
          style={{
            height: 38,
            padding: '0 14px',
            borderRadius: 6,
            background: hazardType === 'Earthquake' ? '#2c1f3d' : '#161b22',
            border: `1.5px solid ${hazardType === 'Earthquake' ? '#c084fc' : '#58a6ff'}`,
            color: hazardType === 'Earthquake' ? '#c084fc' : '#58a6ff',
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
          Earthquake
        </button>

        {topControls}
      </div>

      {open && (
        <div style={{
          position: 'absolute',
          top: 50, left: '50%', transform: 'translateX(-50%)',
          width: 290,
          background: '#161b22',
          border: '1px solid #30363d',
          borderRadius: 8,
          padding: 14,
          boxShadow: '0 4px 20px rgba(0,0,0,.6)',
          fontFamily: 'Inter, sans-serif',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}>

          {/* Header */}
          <div style={{
            fontSize: '0.72rem', fontWeight: 800, color: '#fff',
            textTransform: 'uppercase', letterSpacing: 1,
            borderLeft: '3px solid #ff4d4d', paddingLeft: 8, marginBottom: 12,
          }}>
            ⚠ Hazard Layer
            {user?.role !== 'admin' && (
              <span style={{ float: 'right', fontSize: '0.6rem', color: '#8b949e', fontWeight: 400, textTransform: 'none' }}>
                Read-only
              </span>
            )}
          </div>

          {/* Active hazard badge */}
          {activeHazard?.isActive && (
            <div style={{
              background: '#3d1a1a', border: '1px solid #da3633',
              borderRadius: 4, padding: '6px 10px', marginBottom: 12,
              fontSize: '0.72rem', color: '#ff4d4d', fontWeight: 600,
            }}>
              {activeHazard.type === 'Flood'
                ? `FLOOD — ${floodZones.length} zone${floodZones.length !== 1 ? 's' : ''} active`
                : `HAZARD: ${activeHazard.type} — ${activeHazard.center.lat.toFixed(4)}, ${activeHazard.center.lng.toFixed(4)}`
              }
            </div>
          )}

          {/* ── ADMIN CONTROLS ──────────────────────────────────────────── */}
          {user?.role === 'admin' ? (
            <>
              {/* Disaster type selector */}
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Disaster Type</label>
                <select
                  value={hazardType}
                  onChange={(e) => {
                    setHazardType(e.target.value)
                    setPendingPolygon(null)
                    setIsDrawing(false)
                  }}
                  style={inputStyle}
                >
                  {HAZARD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* ── FLOOD BRANCH ──────────────────────────────────────── */}
              {isFlood ? (
                <>
                  {/* Persisted zones (already saved) */}
                  {floodZones.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <label style={labelStyle}>Saved Zones ({floodZones.length})</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {floodZones.map((z) => (
                          <ZoneCard
                            key={z.id}
                            zone={z}
                            onRemove={() => deleteFloodZone(z.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Draft zones (not yet saved) */}
                  {draftFloodZones.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <label style={labelStyle}>Pending Zones ({draftFloodZones.length})</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {draftFloodZones.map((z) => (
                          <ZoneCard
                            key={z.id}
                            zone={z}
                            onRemove={() => removeDraftFloodZone(z.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Draw trigger */}
                  {!pendingPolygon && (
                    <button
                      onClick={() => setIsDrawing(true)}
                      disabled={isDrawing}
                      style={{
                        width: '100%', padding: '8px',
                        background: isDrawing ? '#21262d' : '#1f6feb',
                        color: isDrawing ? '#8b949e' : '#fff',
                        border: 'none', borderRadius: 4,
                        fontWeight: 700, fontSize: '0.78rem',
                        cursor: isDrawing ? 'not-allowed' : 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        marginBottom: 10,
                      }}
                    >
                      {isDrawing ? '🖊 Drawing… click map to place points' : '🖊 Draw Flood Area'}
                    </button>
                  )}

                  {/* Inline zone form — appears after polygon drawn */}
                  {pendingPolygon && (
                    <div style={{
                      background: '#0d1117',
                      border: '1px solid #238636',
                      borderRadius: 6,
                      padding: 10,
                      marginBottom: 10,
                    }}>
                      <p style={{ margin: '0 0 8px', fontSize: '0.68rem', color: '#3fb950', fontWeight: 600 }}>
                        ✅ Polygon drawn ({pendingPolygon.length} pts) — fill in details
                      </p>

                      <div style={{ marginBottom: 6 }}>
                        <label style={labelStyle}>Severity</label>
                        <select
                          value={draftSeverity}
                          onChange={(e) => setDraftSeverity(e.target.value as FloodSeverity)}
                          style={inputStyle}
                        >
                          <option value="critical">Critical</option>
                          <option value="high">High</option>
                          <option value="elevated">Elevated</option>
                          <option value="stable">Stable</option>
                        </select>
                      </div>

                      <div style={{ marginBottom: 6 }}>
                        <label style={labelStyle}>Water Depth (optional)</label>
                        <select
                          value={draftDepth}
                          onChange={(e) => setDraftDepth(e.target.value as FloodDepth | '')}
                          style={inputStyle}
                        >
                          <option value="">— None —</option>
                          <option value="ankle">Ankle-deep</option>
                          <option value="knee">Knee-deep</option>
                          <option value="waist">Waist-deep</option>
                          <option value="chest">Chest-deep</option>
                        </select>
                      </div>

                      <div style={{ marginBottom: 8 }}>
                        <label style={labelStyle}>Notes (optional)</label>
                        <input
                          type="text"
                          value={draftNotes}
                          onChange={(e) => setDraftNotes(e.target.value)}
                          placeholder="e.g. Near riverbank, fast current"
                          style={inputStyle}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={handleAddZone}
                          style={{
                            flex: 1, padding: '7px',
                            background: '#238636', color: '#fff',
                            border: 'none', borderRadius: 4,
                            fontWeight: 700, fontSize: '0.75rem',
                            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          + Add Zone
                        </button>
                        <button
                          onClick={() => setPendingPolygon(null)}
                          style={{
                            padding: '7px 10px',
                            background: 'transparent', color: '#8b949e',
                            border: '1px solid #30363d', borderRadius: 4,
                            fontSize: '0.75rem', cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* ── VOLCANO / OTHER BRANCH ─────────────────────────────── */
                <>
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
                            type="number" min="0.1" step="0.5"
                            value={val}
                            onChange={(e) => set(e.target.value)}
                            style={inputStyle}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Center picker */}
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

                  <button
                    onClick={handlePickCenter}
                    disabled={isSelectingCenter}
                    style={{
                      width: '100%', padding: '8px',
                      background: '#1f6feb', color: '#fff',
                      border: 'none', borderRadius: 4,
                      fontWeight: 700, fontSize: '0.78rem',
                      cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                      opacity: isSelectingCenter ? 0.6 : 1,
                      marginBottom: 6,
                    }}
                  >
                    📍 Pick Center on Map
                  </button>
                </>
              )}

              {/* ── Shared action buttons ──────────────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                <button
                  onClick={handleActivate}
                  disabled={!canActivate}
                  style={{
                    padding: '8px',
                    background: canActivate ? '#238636' : '#21262d',
                    color:      canActivate ? '#fff'     : '#8b949e',
                    border: 'none', borderRadius: 4,
                    fontWeight: 700, fontSize: '0.78rem',
                    cursor: canActivate ? 'pointer' : 'not-allowed',
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
            </>
          ) : (
            /* ── READ-ONLY VIEW (guests / citizens) ───────────────────── */
            <div style={{ fontSize: '0.75rem', color: '#8b949e', lineHeight: 1.5 }}>
              {activeHazard?.type === 'Flood' ? (
                <>
                  <p style={{ margin: '0 0 8px' }}>
                    An active <b>Flood</b> hazard is being monitored. {floodZones.length} flood zone{floodZones.length !== 1 ? 's' : ''} are marked on the map.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {(['critical', 'high', 'elevated', 'stable'] as FloodSeverity[]).map((sev) => {
                      const count = floodZones.filter((z) => z.severity === sev).length
                      if (!count) return null
                      return (
                        <div key={sev} style={{ color: SEVERITY_COLOR[sev] }}>
                          • {sev.charAt(0).toUpperCase() + sev.slice(1)}: {count} area{count !== 1 ? 's' : ''}
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <>
                  <p style={{ margin: '0 0 8px' }}>
                    An active <b>{activeHazard?.type}</b> hazard zone is being monitored.
                    Triage levels for households within these radii are dynamically adjusted.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ color: RING_COLORS.critical }}>• Critical: {activeHazard?.radii.critical}km</div>
                    <div style={{ color: RING_COLORS.high     }}>• High: {activeHazard?.radii.high}km</div>
                    <div style={{ color: RING_COLORS.elevated }}>• Elevated: {activeHazard?.radii.elevated}km</div>
                    <div style={{ color: RING_COLORS.stable   }}>• Stable: {activeHazard?.radii.stable}km</div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Zone card ─────────────────────────────────────────────────────────────────

function ZoneCard({ zone, onRemove }: { zone: FloodZone; onRemove: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 8px',
      background: '#0d1117',
      border: `1px solid ${SEVERITY_COLOR[zone.severity]}44`,
      borderLeft: `3px solid ${SEVERITY_COLOR[zone.severity]}`,
      borderRadius: 4,
      gap: 6,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: SEVERITY_COLOR[zone.severity], textTransform: 'capitalize' }}>
          {zone.severity}
        </span>
        {zone.depth && (
          <span style={{ fontSize: '0.68rem', color: '#8b949e', marginLeft: 6 }}>
            {zone.depth}-deep
          </span>
        )}
        {zone.notes && (
          <p style={{ margin: '2px 0 0', fontSize: '0.65rem', color: '#8b949e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {zone.notes}
          </p>
        )}
      </div>
      <button
        onClick={onRemove}
        style={{
          background: 'transparent', border: 'none',
          color: '#8b949e', cursor: 'pointer',
          fontSize: '0.9rem', lineHeight: 1, padding: '0 2px',
          flexShrink: 0,
        }}
        title="Remove zone"
      >
        ×
      </button>
    </div>
  )
}

