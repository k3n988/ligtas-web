'use client'
// src/components/dashboard/SummaryReportModal.tsx

import type { Household, Asset } from '@/types'
import { TRIAGE_ORDER } from '@/lib/triage'

interface Props {
  households: Household[]
  assets: Asset[]
  onClose: () => void
}

const LEVEL_COLOR: Record<string, string> = {
  CRITICAL: '#ff4d4d',
  HIGH: '#f39c12',
  ELEVATED: '#f1c40f',
  STABLE: '#58a6ff',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function SummaryReportModal({ households, assets, onClose }: Props) {
  const now = new Date().toISOString()

  const pending = households.filter((h) => h.status === 'Pending')
  const rescued = households.filter((h) => h.status === 'Rescued')
  const dispatched = households.filter((h) => h.assignedAssetId)
  const unassigned = pending.filter((h) => !h.assignedAssetId)

  const counts = {
    CRITICAL: pending.filter((h) => h.triage.level === 'CRITICAL').length,
    HIGH:     pending.filter((h) => h.triage.level === 'HIGH').length,
    ELEVATED: pending.filter((h) => h.triage.level === 'ELEVATED').length,
    STABLE:   pending.filter((h) => h.triage.level === 'STABLE').length,
  }

  // Sort dispatched by severity
  const dispatchedSorted = [...dispatched].sort(
    (a, b) => TRIAGE_ORDER[a.triage.level] - TRIAGE_ORDER[b.triage.level],
  )

  const handlePrint = () => window.print()

  const handleCopy = () => {
    const lines = [
      'L.I.G.T.A.S. INCIDENT SUMMARY REPORT',
      'Bacolod City DRRMO',
      `Generated: ${fmt(now)}`,
      '',
      '=== TRIAGE SUMMARY ===',
      `Total Registered : ${households.length}`,
      `Critical         : ${counts.CRITICAL}`,
      `High             : ${counts.HIGH}`,
      `Elevated         : ${counts.ELEVATED}`,
      `Stable           : ${counts.STABLE}`,
      `Rescued          : ${rescued.length}`,
      `Pending          : ${pending.length}`,
      '',
      '=== DISPATCHED RESCUES ===',
      ...dispatchedSorted.map((hh) => {
        const a = assets.find((x) => x.id === hh.assignedAssetId)
        return `• ${hh.head} | ${hh.triage.level} | Brgy. ${hh.barangay}, ${hh.city} | ${a ? a.name : 'N/A'}${hh.dispatchedAt ? ' | ' + fmt(hh.dispatchedAt) : ''}`
      }),
      dispatched.length === 0 ? '  (none)' : '',
      '',
      '=== PENDING — UNASSIGNED ===',
      ...unassigned.map((hh) =>
        `• ${hh.head} | ${hh.triage.level} | Brgy. ${hh.barangay}, ${hh.city}`,
      ),
      unassigned.length === 0 ? '  (none)' : '',
      '',
      '=== ASSETS DEPLOYED ===',
      ...assets.map((a) => `• ${a.name} | ${a.unit} | ${a.status}`),
    ]
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => alert('Report copied to clipboard.'))
      .catch(() => alert('Copy failed — try the Print button instead.'))
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          zIndex: 1000,
        }}
      />

      {/* Modal */}
      <div
        className="summary-report-modal"
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(700px, 95vw)',
          maxHeight: '88vh',
          overflowY: 'auto',
          background: '#161b22',
          border: '1px solid #30363d',
          borderRadius: 10,
          zIndex: 1001,
          fontFamily: 'Inter, sans-serif',
          color: '#c9d1d9',
        }}
      >
        {/* Modal header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px 22px 14px',
            borderBottom: '1px solid #30363d',
            position: 'sticky',
            top: 0,
            background: '#161b22',
            zIndex: 1,
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>
              Incident Summary Report
            </div>
            <div style={{ fontSize: '0.72rem', color: '#8b949e', marginTop: 2 }}>
              Generated: {fmt(now)} &mdash; Bacolod City DRRMO
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none',
              color: '#8b949e', fontSize: '1.2rem',
              cursor: 'pointer', lineHeight: 1, padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 22px' }}>

          {/* Triage stats grid */}
          <SectionLabel>Triage Summary</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
            {(['CRITICAL','HIGH','ELEVATED','STABLE'] as const).map((lvl) => (
              <StatCell key={lvl} label={lvl} value={counts[lvl]} color={LEVEL_COLOR[lvl]} />
            ))}
            <StatCell label="RESCUED" value={rescued.length} color="#238636" />
            <StatCell label="TOTAL" value={households.length} color="#58a6ff" />
          </div>

          {/* Dispatched rescues */}
          <SectionLabel>Dispatched Rescues ({dispatched.length})</SectionLabel>
          {dispatchedSorted.length === 0 ? (
            <EmptyNote>No rescues dispatched yet.</EmptyNote>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', marginBottom: 20 }}>
              <thead>
                <tr style={{ color: '#8b949e', textTransform: 'uppercase', fontSize: '0.68rem' }}>
                  <Th>Household</Th>
                  <Th>Level</Th>
                  <Th>Location</Th>
                  <Th>Asset</Th>
                  <Th>Dispatched At</Th>
                </tr>
              </thead>
              <tbody>
                {dispatchedSorted.map((hh) => {
                  const a = assets.find((x) => x.id === hh.assignedAssetId)
                  return (
                    <tr key={hh.id} style={{ borderTop: '1px solid #21262d' }}>
                      <Td bold>{hh.head}</Td>
                      <Td>
                        <span style={{ color: hh.triage.hex, fontWeight: 700 }}>
                          {hh.triage.level}
                        </span>
                      </Td>
                      <Td muted>Brgy. {hh.barangay}, {hh.city}</Td>
                      <Td>{a ? `${a.icon} ${a.name}` : '—'}</Td>
                      <Td muted>{hh.dispatchedAt ? fmt(hh.dispatchedAt) : '—'}</Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {/* Pending unassigned */}
          <SectionLabel>Pending — Unassigned ({unassigned.length})</SectionLabel>
          {unassigned.length === 0 ? (
            <EmptyNote style={{ color: '#238636' }}>All pending households have been assigned.</EmptyNote>
          ) : (
            <div style={{ marginBottom: 20 }}>
              {[...unassigned]
                .sort((a, b) => TRIAGE_ORDER[a.triage.level] - TRIAGE_ORDER[b.triage.level])
                .map((hh) => (
                <div
                  key={hh.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '7px 0', borderTop: '1px solid #21262d', fontSize: '0.78rem',
                  }}
                >
                  <div>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{hh.head}</span>
                    <span style={{ color: '#8b949e', marginLeft: 8 }}>
                      Brgy. {hh.barangay}, {hh.city}
                    </span>
                  </div>
                  <span style={{ color: hh.triage.hex, fontWeight: 700, fontSize: '0.72rem' }}>
                    {hh.triage.level}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Assets deployed */}
          <SectionLabel>Assets Deployed</SectionLabel>
          <div style={{ marginBottom: 24 }}>
            {assets.map((a) => (
              <div
                key={a.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '7px 0', borderTop: '1px solid #21262d', fontSize: '0.8rem',
                }}
              >
                <span>{a.icon} {a.name} &mdash; <span style={{ color: '#8b949e' }}>{a.unit}</span></span>
                <span
                  style={{
                    fontWeight: 700, fontSize: '0.7rem',
                    color: a.status === 'Active' ? '#238636'
                         : a.status === 'Dispatching' ? '#f39c12'
                         : '#8b949e',
                  }}
                >
                  {a.status}
                </span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handlePrint}
              style={{
                flex: 1, padding: '11px',
                background: '#58a6ff', color: '#0d1117',
                border: 'none', borderRadius: 6,
                fontWeight: 700, fontSize: '0.85rem',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              🖨 Print Report
            </button>
            <button
              onClick={handleCopy}
              style={{
                flex: 1, padding: '11px',
                background: 'transparent',
                border: '1px solid #30363d',
                color: '#c9d1d9',
                borderRadius: 6,
                fontWeight: 700, fontSize: '0.85rem',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              📋 Copy to Clipboard
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Small helpers ──────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '0.7rem', color: '#8b949e',
        textTransform: 'uppercase', letterSpacing: 1,
        marginBottom: 10, fontWeight: 600,
      }}
    >
      {children}
    </div>
  )
}

function StatCell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        background: '#0d1117', border: `1px solid ${color}33`,
        borderRadius: 6, padding: '10px 12px', textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '0.65rem', color: '#8b949e', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600, letterSpacing: 0.5 }}>
      {children}
    </th>
  )
}

function Td({ children, bold, muted }: { children: React.ReactNode; bold?: boolean; muted?: boolean }) {
  return (
    <td
      style={{
        padding: '8px 8px',
        color: muted ? '#8b949e' : bold ? '#fff' : '#c9d1d9',
        fontWeight: bold ? 600 : 400,
      }}
    >
      {children}
    </td>
  )
}

function EmptyNote({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        padding: '10px 0', fontSize: '0.8rem',
        color: '#8b949e', marginBottom: 20, ...style,
      }}
    >
      {children}
    </div>
  )
}
