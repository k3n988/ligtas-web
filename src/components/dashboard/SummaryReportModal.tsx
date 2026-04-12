'use client'

import type { Asset, Household } from '@/types'
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

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  textAlign: 'left',
  fontSize: '0.68rem',
  fontWeight: 700,
  color: 'var(--fg-muted)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '12px 14px',
  fontSize: '0.8rem',
  color: 'var(--fg-default)',
  borderBottom: '1px solid var(--border-subtle)',
  verticalAlign: 'top',
}

const sectionShell: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 18,
  overflow: 'hidden',
  background: 'var(--bg-surface)',
  boxShadow: 'var(--shadow-soft)',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusBadgeStyle(status: 'Pending' | 'Rescued'): React.CSSProperties {
  const isRescued = status === 'Rescued'
  return {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 999,
    fontSize: '0.7rem',
    fontWeight: 700,
    background: isRescued ? 'var(--success-soft)' : 'var(--warning-soft)',
    border: `1px solid ${isRescued ? 'var(--success-border)' : 'var(--warning-border)'}`,
    color: isRescued ? 'var(--success-strong)' : 'var(--warning-strong)',
  }
}

function assetStatusBadgeStyle(status: string): React.CSSProperties {
  if (status === 'Active') {
    return {
      background: 'var(--success-soft)',
      border: '1px solid var(--success-border)',
      color: 'var(--success-strong)',
    }
  }

  if (status === 'Dispatching') {
    return {
      background: 'var(--warning-soft)',
      border: '1px solid var(--warning-border)',
      color: 'var(--warning-strong)',
    }
  }

  return {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    color: 'var(--fg-muted)',
  }
}

export default function SummaryReportModal({ households, assets }: Props) {
  const now = new Date().toISOString()
  const pending = households.filter((h) => h.status === 'Pending')
  const rescued = households.filter((h) => h.status === 'Rescued')

  const counts = {
    CRITICAL: pending.filter((h) => h.triage.level === 'CRITICAL').length,
    HIGH: pending.filter((h) => h.triage.level === 'HIGH').length,
    ELEVATED: pending.filter((h) => h.triage.level === 'ELEVATED').length,
    STABLE: pending.filter((h) => h.triage.level === 'STABLE').length,
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
        const asset = assets.find((item) => item.id === hh.assignedAssetId)
        return `${hh.head} | ${hh.triage.level} | ${hh.barangay}, ${hh.city} | ${hh.status} | ${asset ? asset.name : 'Unassigned'}`
      }),
      '',
      '=== ASSETS ===',
      ...assets.map((asset) => `${asset.name} | ${asset.unit} | ${asset.status}`),
    ]

    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => alert('Report copied to clipboard.'))
      .catch(() => alert('Copy failed. Try Print instead.'))
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: 'var(--fg-default)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--fg-strong)' }}>
            L.I.G.T.A.S. Incident Summary Report
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--accent-strong)', marginTop: 3 }}>
            Generated: {fmt(now)} &mdash; Bacolod City DRRMO Command Center
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={handlePrint}
            style={{
              padding: '8px 14px',
              background: 'var(--accent-solid)',
              border: '1px solid var(--accent-solid)',
              color: '#fff',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Print
          </button>
          <button
            onClick={handleCopy}
            style={{
              padding: '8px 14px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--fg-default)',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Copy
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 10, marginBottom: 28 }}>
        {[
          { label: 'CRITICAL', value: counts.CRITICAL, color: LEVEL_COLOR.CRITICAL },
          { label: 'HIGH', value: counts.HIGH, color: LEVEL_COLOR.HIGH },
          { label: 'ELEVATED', value: counts.ELEVATED, color: LEVEL_COLOR.ELEVATED },
          { label: 'STABLE', value: counts.STABLE, color: LEVEL_COLOR.STABLE },
          { label: 'RESCUED', value: rescued.length, color: '#2da44e' },
          { label: 'TOTAL', value: households.length, color: 'var(--fg-strong)' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              background: 'var(--bg-surface)',
              border: `1px solid color-mix(in srgb, ${color} 28%, var(--border))`,
              borderRadius: 16,
              padding: '14px 12px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-soft)',
            }}
          >
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--fg-muted)', marginTop: 5, letterSpacing: 0.5 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', borderLeft: '3px solid var(--accent-solid)', paddingLeft: 10, marginBottom: 12 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-strong)', textTransform: 'uppercase', letterSpacing: 1 }}>
            All Households ({households.length})
          </span>
        </div>
        <div style={sectionShell}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--bg-elevated)' }}>
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
                  <td colSpan={7} style={{ ...tdStyle, color: 'var(--fg-muted)', textAlign: 'center', padding: '20px' }}>
                    No households registered yet.
                  </td>
                </tr>
              )}
              {allSorted.map((hh) => {
                const asset = assets.find((item) => item.id === hh.assignedAssetId)
                return (
                  <tr
                    key={hh.id}
                    style={{ background: 'var(--bg-surface)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-surface)' }}
                  >
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: 'var(--fg-strong)' }}>{hh.head}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--fg-muted)', marginTop: 2 }}>{hh.contact}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 700, fontSize: '0.72rem', color: LEVEL_COLOR[hh.triage.level] ?? 'var(--fg-strong)' }}>
                        {hh.triage.level}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div>Brgy. {hh.barangay}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--fg-muted)' }}>{hh.city}</div>
                    </td>
                    <td style={{ ...tdStyle, fontSize: '0.74rem', color: 'var(--fg-muted)' }}>
                      {hh.source ?? '-'}
                    </td>
                    <td style={tdStyle}>
                      <span style={statusBadgeStyle(hh.status)}>{hh.status}</span>
                    </td>
                    <td style={tdStyle}>
                      {asset ? `${asset.icon} ${asset.name}` : <span style={{ color: 'var(--fg-muted)' }}>Unassigned</span>}
                    </td>
                    <td style={{ ...tdStyle, fontSize: '0.74rem', color: 'var(--fg-muted)' }}>
                      {hh.dispatchedAt ? fmt(hh.dispatchedAt) : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', borderLeft: '3px solid var(--accent-solid)', paddingLeft: 10, marginBottom: 12 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-strong)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Assets ({assets.length})
          </span>
        </div>
        <div style={sectionShell}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--bg-elevated)' }}>
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
                  <td colSpan={6} style={{ ...tdStyle, color: 'var(--fg-muted)', textAlign: 'center', padding: '20px' }}>
                    No assets registered yet.
                  </td>
                </tr>
              )}
              {assets.map((asset) => {
                const assignedHouseholds = households.filter((hh) => hh.assignedAssetId === asset.id)
                return (
                  <tr
                    key={asset.id}
                    style={{ background: 'var(--bg-surface)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-surface)' }}
                  >
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: 'var(--fg-strong)' }}>{asset.icon} {asset.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--fg-muted)', marginTop: 2 }}>{asset.id}</div>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--fg-muted)', fontSize: '0.78rem' }}>{asset.type}</td>
                    <td style={{ ...tdStyle, color: 'var(--fg-muted)', fontSize: '0.78rem' }}>{asset.unit}</td>
                    <td style={{ ...tdStyle, color: 'var(--fg-muted)', fontSize: '0.78rem' }}>{asset.contact ?? '-'}</td>
                    <td style={tdStyle}>
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, ...assetStatusBadgeStyle(asset.status) }}>
                        {asset.status}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontSize: '0.74rem' }}>
                      {assignedHouseholds.length === 0 ? (
                        <span style={{ color: 'var(--fg-muted)' }}>-</span>
                      ) : (
                        assignedHouseholds.map((hh) => (
                          <div key={hh.id} style={{ color: 'var(--fg-default)' }}>
                            {hh.head}
                            <span style={{ color: 'var(--fg-muted)', marginLeft: 4 }}>({hh.triage.level})</span>
                          </div>
                        ))
                      )}
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
