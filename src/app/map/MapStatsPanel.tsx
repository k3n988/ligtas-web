'use client'
// src/app/map/MapStatsPanel.tsx

import { useMemo, useState } from 'react'
import { useHouseholdStore } from '@/store/householdStore'
import { useAssetStore } from '@/store/assetStore'
import { useHazardStore } from '@/store/hazardStore'
import { TRIAGE_ORDER } from '@/lib/triage'
import { pointInPolygon } from '@/lib/geo'
import SummaryReportModal from '@/components/dashboard/SummaryReportModal'

const SEVERITY_COLOR: Record<string, string> = {
  Critical: '#ff4d4d',
  High:     '#f39c12',
  Elevated: '#f1c40f',
}

const DISASTER_EMOJI: Record<string, string> = {
  Flood: '🌊', Fire: '🔥', Landslide: '⛰️', Storm: '🌀', Earthquake: '📳',
}

export default function MapStatsPanel() {
  const households = useHouseholdStore((s) => s.households)
  const assets     = useAssetStore((s) => s.assets)
  const hazards    = useHazardStore((s) => s.hazards)
  const clearHazard = useHazardStore((s) => s.clearHazard)
  const [showReport, setShowReport] = useState(false)

  // Derive per-hazard rescue status (mirrors the logic in HazardOverlay)
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

  const pending = households.filter((h) => h.status === 'Pending')
  const rescued = households.filter((h) => h.status === 'Rescued')

  const counts = {
    CRITICAL: pending.filter((h) => h.triage.level === 'CRITICAL').length,
    HIGH: pending.filter((h) => h.triage.level === 'HIGH').length,
    ELEVATED: pending.filter((h) => h.triage.level === 'ELEVATED').length,
    STABLE: pending.filter((h) => h.triage.level === 'STABLE').length,
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
          {statCard('HIGH', counts.HIGH, '#f39c12')}
          {statCard('ELEVATED', counts.ELEVATED, '#f1c40f')}
          {statCard('RESCUED', rescued.length, '#238636')}
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
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Total Registered
          </span>
          <span style={{ fontWeight: 700, color: '#fff' }}>{households.length}</span>
        </div>

        {/* Active Assets */}
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
              <span>
                {a.icon} {a.name}
              </span>
              <span
                style={{
                  color:
                    a.status === 'Active'
                      ? 'var(--resolved-green)'
                      : a.status === 'Dispatching'
                      ? 'var(--high-orange)'
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

        {/* Top Priority */}
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

        {/* Hazard Command */}
        <h2
          style={{
            margin: '0 0 10px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Hazard Zones
        </h2>
        {hazardStatus.length === 0 ? (
          <div
            style={{
              padding: '10px 14px',
              marginBottom: 20,
              background: '#21262d',
              borderRadius: 6,
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}
          >
            No active hazard zones.
          </div>
        ) : (
          <div style={{ marginBottom: 20 }}>
            {hazardStatus.map(({ hazard, inside, rescuedCount, allRescued }) => (
              <div
                key={hazard.id}
                style={{
                  padding: '10px 12px',
                  marginBottom: 8,
                  background: '#21262d',
                  borderRadius: 6,
                  borderLeft: `3px solid ${allRescued ? '#238636' : SEVERITY_COLOR[hazard.severity]}`,
                }}
              >
                {/* Zone header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.82rem' }}>
                    {DISASTER_EMOJI[hazard.disasterType]} {hazard.label}
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: allRescued ? '#238636' : SEVERITY_COLOR[hazard.severity],
                    }}
                  >
                    {hazard.severity.toUpperCase()}
                  </span>
                </div>

                {/* Progress bar */}
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

                {/* Resolution State 2 — clearHazardArea() */}
                <button
                  onClick={() => clearHazard(hazard.id)}
                  disabled={!allRescued}
                  title={
                    allRescued
                      ? 'Hazard physically cleared — remove zone from map'
                      : 'All citizens must be rescued before clearing'
                  }
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
            ))}
          </div>
        )}

        {/* Finalize Report button */}
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
