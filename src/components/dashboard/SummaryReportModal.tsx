'use client'
// src/components/dashboard/SummaryReportModal.tsx

import type { Household, Asset } from '@/types'
import { TRIAGE_ORDER } from '@/lib/triage'

interface Props {
  households: Household[]
  assets:     Asset[]
  onClose:    () => void
}

const LEVEL_COLOR: Record<string, string> = {
  CRITICAL: '#ff4d4d',
  HIGH:     '#f39c12',
  ELEVATED: '#f1c40f',
  STABLE:   '#58a6ff',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  textAlign: 'left',
  fontSize: '0.68rem',
  fontWeight: 700,
  color: '#8b949e',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  borderBottom: '1px solid #30363d',
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '12px 14px',
  fontSize: '0.8rem',
  color: '#c9d1d9',
  borderBottom: '1px solid #21262d',
  verticalAlign: 'top',
}

export default function SummaryReportModal({ households, assets }: Props) {
  const now     = new Date().toISOString()
  const pending = households.filter((h) => h.status === 'Pending')
  const rescued = households.filter((h) => h.status === 'Rescued')

  const counts = {
    CRITICAL: pending.filter((h) => h.triage.level === 'CRITICAL').length,
    HIGH:     pending.filter((h) => h.triage.level === 'HIGH').length,
    ELEVATED: pending.filter((h) => h.triage.level === 'ELEVATED').length,
    STABLE:   pending.filter((h) => h.triage.level === 'STABLE').length,
  }

  const allSorted = [...households].sort(
    (a, b) => TRIAGE_ORDER[a.triage.level] - TRIAGE_ORDER[b.triage.level],
  )

  const handlePrint = () => window.print()

  const handleCopy = () => {
    const lines = [
      'L.I.G.T.A.S. INCIDENT SUMMARY REPORT',
      `Generated: ${fmt(now)}`,
      '',
      `CRITICAL: ${counts.CRITICAL}  HIGH: ${counts.HIGH}  ELEVATED: ${counts.ELEVATED}  STABLE: ${counts.STABLE}`,
      `RESCUED: ${rescued.length}  PENDING: ${pending.length}  TOTAL: ${households.length}`,
      '',
      '=== ALL HOUSEHOLDS ===',
      ...allSorted.map((hh) => {
        const a = assets.find((x) => x.id === hh.assignedAssetId)
        return `${hh.head} | ${hh.triage.level} | ${hh.barangay}, ${hh.city} | ${hh.status} | ${a ? a.name : 'Unassigned'}`
      }),
      '',
      '=== ASSETS ===',
      ...assets.map((a) => `${a.name} | ${a.unit} | ${a.status}`),
    ]
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => alert('Report copied to clipboard.'))
      .catch(() => alert('Copy failed — try Print instead.'))
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: '#c9d1d9' }}>

      {/* ── Report header ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 20,
      }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
            L.I.G.T.A.S. — Incident Summary Report
          </div>
          <div style={{ fontSize: '0.72rem', color: '#58a6ff', marginTop: 3 }}>
            Generated: {fmt(now)} &mdash; Bacolod City DRRMO Command Center
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handlePrint}
            style={{
              padding: '6px 14px', background: '#1f6feb',
              border: 'none', color: '#fff', borderRadius: 4,
              fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            🖨 Print
          </button>
          <button
            onClick={handleCopy}
            style={{
              padding: '6px 14px', background: 'transparent',
              border: '1px solid #30363d', color: '#c9d1d9', borderRadius: 4,
              fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            📋 Copy
          </button>
        </div>
      </div>

      {/* ── Triage stat cards ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 28 }}>
        {([
          { label: 'CRITICAL', value: counts.CRITICAL, color: LEVEL_COLOR.CRITICAL },
          { label: 'HIGH',     value: counts.HIGH,     color: LEVEL_COLOR.HIGH     },
          { label: 'ELEVATED', value: counts.ELEVATED, color: LEVEL_COLOR.ELEVATED },
          { label: 'STABLE',   value: counts.STABLE,   color: LEVEL_COLOR.STABLE   },
          { label: 'RESCUED',  value: rescued.length,  color: '#3fb950'            },
          { label: 'TOTAL',    value: households.length, color: '#e6edf3'          },
        ] as const).map(({ label, value, color }) => (
          <div key={label} style={{
            background: '#0d1117', border: `1px solid ${color}33`,
            borderRadius: 6, padding: '12px 10px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.6rem', color: '#8b949e', marginTop: 5, letterSpacing: 0.5 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Section: All Households ───────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          borderLeft: '3px solid #58a6ff', paddingLeft: 10,
          marginBottom: 12,
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>
            All Households ({households.length})
          </span>
        </div>
        <div style={{ border: '1px solid #30363d', borderRadius: 6, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#161b22' }}>
              <tr>
                <th style={thStyle}>Household Head</th>
                <th style={thStyle}>Triage</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Source</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Assigned Asset</th>
                <th style={thStyle}>Dispatched At</th>
              </tr>
            </thead>
            <tbody>
              {allSorted.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ ...tdStyle, color: '#8b949e', textAlign: 'center', padding: '20px' }}>
                    No households registered yet.
                  </td>
                </tr>
              )}
              {allSorted.map((hh) => {
                const asset = assets.find((x) => x.id === hh.assignedAssetId)
                return (
                  <tr key={hh.id} style={{ background: '#0d1117' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#161b22')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#0d1117')}
                  >
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{hh.head}</div>
                      <div style={{ fontSize: '0.7rem', color: '#8b949e', marginTop: 2 }}>{hh.contact}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        fontWeight: 700, fontSize: '0.72rem',
                        color: LEVEL_COLOR[hh.triage.level] ?? '#fff',
                      }}>
                        {hh.triage.level}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div>Brgy. {hh.barangay}</div>
                      <div style={{ fontSize: '0.72rem', color: '#8b949e' }}>{hh.city}</div>
                    </td>
                    <td style={{ ...tdStyle, fontSize: '0.74rem', color: '#8b949e' }}>
                      {hh.source ?? '—'}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 10px', borderRadius: 20,
                        fontSize: '0.7rem', fontWeight: 700,
                        background: hh.status === 'Rescued' ? '#0d2016' : '#1f1a0e',
                        border: `1px solid ${hh.status === 'Rescued' ? '#238636' : '#9e6a03'}`,
                        color: hh.status === 'Rescued' ? '#3fb950' : '#d29922',
                      }}>
                        {hh.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {asset ? `${asset.icon} ${asset.name}` : <span style={{ color: '#8b949e' }}>Unassigned</span>}
                    </td>
                    <td style={{ ...tdStyle, fontSize: '0.74rem', color: '#8b949e' }}>
                      {hh.dispatchedAt ? fmt(hh.dispatchedAt) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section: Assets ───────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          borderLeft: '3px solid #58a6ff', paddingLeft: 10,
          marginBottom: 12,
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>
            Assets ({assets.length})
          </span>
        </div>
        <div style={{ border: '1px solid #30363d', borderRadius: 6, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#161b22' }}>
              <tr>
                <th style={thStyle}>Asset</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Unit / Agency</th>
                <th style={thStyle}>Contact</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...tdStyle, color: '#8b949e', textAlign: 'center', padding: '20px' }}>
                    No assets registered yet.
                  </td>
                </tr>
              )}
              {assets.map((a) => {
                const assignedHH = households.filter((hh) => hh.assignedAssetId === a.id)
                return (
                  <tr key={a.id} style={{ background: '#0d1117' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#161b22')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#0d1117')}
                  >
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{a.icon} {a.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#8b949e', marginTop: 2 }}>{a.id}</div>
                    </td>
                    <td style={{ ...tdStyle, color: '#8b949e', fontSize: '0.78rem' }}>{a.type}</td>
                    <td style={{ ...tdStyle, color: '#8b949e', fontSize: '0.78rem' }}>{a.unit}</td>
                    <td style={{ ...tdStyle, color: '#8b949e', fontSize: '0.78rem' }}>{a.contact ?? '—'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 10px', borderRadius: 20,
                        fontSize: '0.7rem', fontWeight: 700,
                        background: a.status === 'Active' ? '#0d2016'
                          : a.status === 'Dispatching' ? '#1f1a0e' : '#21262d',
                        border: `1px solid ${a.status === 'Active' ? '#238636'
                          : a.status === 'Dispatching' ? '#9e6a03' : '#30363d'}`,
                        color: a.status === 'Active' ? '#3fb950'
                          : a.status === 'Dispatching' ? '#d29922' : '#8b949e',
                      }}>
                        {a.status}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontSize: '0.74rem' }}>
                      {assignedHH.length === 0
                        ? <span style={{ color: '#8b949e' }}>—</span>
                        : assignedHH.map((hh) => (
                          <div key={hh.id} style={{ color: '#c9d1d9' }}>
                            {hh.head}
                            <span style={{ color: '#8b949e', marginLeft: 4 }}>
                              ({hh.triage.level})
                            </span>
                          </div>
                        ))
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
