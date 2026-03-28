'use client'
// src/app/map/MapStatsPanel.tsx

import { useMemo, useState } from 'react'
import { useHouseholdStore } from '@/store/householdStore'
import { useAssetStore } from '@/store/assetStore'
import { useHazardStore } from '@/store/hazardStore'
import { TRIAGE_ORDER } from '@/lib/triage'
import { pointInPolygon } from '@/lib/geo'
import type { DisasterType, HazardLevel } from '@/types'
import SummaryReportModal from '@/components/dashboard/SummaryReportModal'

// ─── NOAH color scale ─────────────────────────────────────────────────────────

const LEVEL_COLOR: Record<HazardLevel | 'None', string> = {
  High:   '#e74c3c',
  Medium: '#e67e22',
  Low:    '#f4d03f',
  None:   '#30363d',
}

const LEVEL_ORDER: Record<HazardLevel, number> = { High: 3, Medium: 2, Low: 1 }

const ALL_DISASTER_TYPES: { type: DisasterType; emoji: string; label: string }[] = [
  { type: 'Flood',      emoji: '🌊', label: 'Flood Hazard Level' },
  { type: 'Storm',      emoji: '🌀', label: 'Storm Surge Level' },
  { type: 'Landslide',  emoji: '⛰️', label: 'Landslide Level' },
  { type: 'Earthquake', emoji: '📳', label: 'Earthquake Level' },
  { type: 'Fire',       emoji: '🔥', label: 'Fire Hazard Level' },
]

export default function MapStatsPanel() {
  const households  = useHouseholdStore((s) => s.households)
  const assets      = useAssetStore((s) => s.assets)
  const hazards     = useHazardStore((s) => s.hazards)
  const clearHazard = useHazardStore((s) => s.clearHazard)
  const [showReport, setShowReport] = useState(false)

  // Per-hazard rescue progress (mirrors HazardOverlay logic)
  const hazardStatus = useMemo(
    () =>
      hazards.map((h) => {
        const inside       = households.filter((hh) =>
          pointInPolygon({ lat: hh.lat, lng: hh.lng }, h.polygon),
        )
        const rescuedCount = inside.filter((hh) => hh.status === 'Rescued').length
        const allRescued   = inside.length > 0 && rescuedCount === inside.length
        return { hazard: h, inside, rescuedCount, allRescued }
      }),
    [hazards, households],
  )

  // NOAH panel: highest active level per disaster type
  const levelByType = useMemo(
    () =>
      Object.fromEntries(
        ALL_DISASTER_TYPES.map(({ type }) => {
          const zones = hazards.filter((h) => h.disasterType === type)
          if (zones.length === 0) return [type, 'None' as const]
          const highest = zones.reduce<HazardLevel>(
            (max, h) => (LEVEL_ORDER[h.level] > LEVEL_ORDER[max] ? h.level : max),
            'Low',
          )
          return [type, highest]
        }),
      ) as Record<DisasterType, HazardLevel | 'None'>,
    [hazards],
  )

  const pending = households.filter((h) => h.status === 'Pending')
  const rescued = households.filter((h) => h.status === 'Rescued')

  const counts = {
    CRITICAL: pending.filter((h) => h.triage.level === 'CRITICAL').length,
    HIGH:     pending.filter((h) => h.triage.level === 'HIGH').length,
    ELEVATED: pending.filter((h) => h.triage.level === 'ELEVATED').length,
    STABLE:   pending.filter((h) => h.triage.level === 'STABLE').length,
  }

  const topPriority = [...pending].sort(
    (a, b) => TRIAGE_ORDER[a.triage.level] - TRIAGE_ORDER[b.triage.level],
  )

  const statCard = (label: string, value: number | string, color: string) => (
    <div
      style={{
        background: '#21262d',
        border: `1px solid ${color}`,
        borderRadius: 6,
        padding: '12px 15px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
    </div>
  )

  return (
    <>
      <div>
        {/* ── Triage overview ───────────────────────────────────────────────── */}
        <h2
          style={{
            margin: '0 0 16px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Operational Overview
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {statCard('CRITICAL', counts.CRITICAL, '#ff4d4d')}
          {statCard('HIGH',     counts.HIGH,     '#f39c12')}
          {statCard('ELEVATED', counts.ELEVATED, '#f1c40f')}
          {statCard('RESCUED',  rescued.length,  '#238636')}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 20,
            padding: '10px 14px',
            background: '#21262d',
            borderRadius: 6,
            border: '1px solid var(--border-color)',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Registered</span>
          <span style={{ fontWeight: 700, color: '#fff' }}>{households.length}</span>
        </div>

        {/* ── NOAH-style Hazard Levels In Your Area ─────────────────────────── */}
        <div
          style={{
            background: '#0d1117',
            border: '1px solid #30363d',
            borderRadius: 8,
            overflow: 'hidden',
            marginBottom: 20,
          }}
        >
          {/* Panel header — matches NOAH branding style */}
          <div
            style={{
              background: '#1c4f8a',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: '1rem' }}>🔵</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#fff', letterSpacing: 0.5 }}>
                NATIONWIDE OPERATIONS &amp; ASSESSMENT OF HAZARDS
              </div>
              <div style={{ fontSize: '0.65rem', color: '#93c5fd', marginTop: 1 }}>
                Hazard Levels In Your Area
              </div>
            </div>
          </div>

          {/* Per-type hazard level cards */}
          <div style={{ padding: '8px 0' }}>
            {ALL_DISASTER_TYPES.map(({ type, emoji, label }) => {
              const lvl   = levelByType[type]
              const color = LEVEL_COLOR[lvl]
              const isActive = lvl !== 'None'

              return (
                <div
                  key={type}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '9px 14px',
                    borderBottom: '1px solid #1c2128',
                    gap: 12,
                  }}
                >
                  {/* Icon bubble */}
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 6,
                      background: isActive ? `${color}22` : '#161b22',
                      border: `1px solid ${isActive ? color : '#30363d'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      flexShrink: 0,
                    }}
                  >
                    {emoji}
                  </div>

                  {/* Label + level */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        marginBottom: 2,
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        color: isActive ? color : '#6e7681',
                        letterSpacing: 0.5,
                      }}
                    >
                      {lvl === 'None' ? 'NONE' : lvl.toUpperCase()}
                    </div>
                  </div>

                  {/* Color swatch */}
                  {isActive && (
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: color,
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* NOAH legend footer */}
          <div
            style={{
              padding: '8px 14px',
              background: '#161b22',
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              borderTop: '1px solid #1c2128',
            }}
          >
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Hazard Level:</span>
            {(['Low', 'Medium', 'High'] as HazardLevel[]).map((l) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    background: LEVEL_COLOR[l],
                    borderRadius: 2,
                  }}
                />
                <span style={{ fontSize: '0.65rem', color: '#c9d1d9' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Active hazard zone command cards ──────────────────────────────── */}
        {hazardStatus.length > 0 && (
          <>
            <h2
              style={{
                margin: '0 0 10px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Zone Command
            </h2>
            <div style={{ marginBottom: 20 }}>
              {hazardStatus.map(({ hazard, inside, rescuedCount, allRescued }) => {
                const clr = allRescued ? '#238636' : LEVEL_COLOR[hazard.level]
                return (
                  <div
                    key={hazard.id}
                    style={{
                      padding: '10px 12px',
                      marginBottom: 8,
                      background: '#21262d',
                      borderRadius: 6,
                      borderLeft: `3px solid ${clr}`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.82rem' }}>
                        {hazard.label}
                      </span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: clr }}>
                        {allRescued ? 'ALL RESCUED' : hazard.level.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ marginBottom: 6, fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                      {rescuedCount} / {inside.length} rescued
                    </div>
                    <div
                      style={{
                        height: 5,
                        background: '#30363d',
                        borderRadius: 3,
                        overflow: 'hidden',
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${inside.length ? (rescuedCount / inside.length) * 100 : 0}%`,
                          background: allRescued ? '#238636' : '#58a6ff',
                          borderRadius: 3,
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>

                    <button
                      onClick={() => clearHazard(hazard.id)}
                      disabled={!allRescued}
                      title={allRescued ? 'Remove zone — hazard cleared' : 'Rescue all citizens first'}
                      style={{
                        width: '100%',
                        padding: '5px',
                        background: 'transparent',
                        border: `1px solid ${allRescued ? '#238636' : '#30363d'}`,
                        color: allRescued ? '#238636' : '#6e7681',
                        borderRadius: 4,
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        cursor: allRescued ? 'pointer' : 'not-allowed',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {allRescued ? '✓ Clear Hazard Area' : '🔒 Clear Hazard Area'}
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ── Active Assets ─────────────────────────────────────────────────── */}
        <h2
          style={{
            margin: '0 0 10px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Active Assets
        </h2>
        <div style={{ marginBottom: 20 }}>
          {assets.map((a) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '0.82rem',
              }}
            >
              <span>{a.icon} {a.name}</span>
              <span
                style={{
                  color:
                    a.status === 'Active'      ? 'var(--resolved-green)'
                    : a.status === 'Dispatching' ? 'var(--high-orange)'
                    : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                }}
              >
                {a.status}
              </span>
            </div>
          ))}
        </div>

        {/* ── Highest Priority ──────────────────────────────────────────────── */}
        {topPriority.length > 0 && (
          <>
            <h2
              style={{
                margin: '0 0 10px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Highest Priority
            </h2>
            {topPriority.slice(0, 3).map((hh) => (
              <div
                key={hh.id}
                style={{
                  padding: '10px 14px',
                  marginBottom: 8,
                  background: '#21262d',
                  borderRadius: 6,
                  borderLeft: `3px solid ${hh.triage.hex}`,
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ fontWeight: 600, color: '#fff', marginBottom: 2 }}>{hh.head}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {hh.street}, {hh.barangay}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── Report ───────────────────────────────────────────────────────── */}
        <div style={{ marginTop: 24, borderTop: '1px solid #30363d', paddingTop: 18 }}>
          <button
            onClick={() => setShowReport(true)}
            style={{
              width: '100%',
              padding: '12px',
              background: '#238636',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: 0.5,
            }}
          >
            📋 Finalize &amp; Export Report
          </button>
        </div>
      </div>

      {showReport && (
        <SummaryReportModal
          households={households}
          assets={assets}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  )
}
