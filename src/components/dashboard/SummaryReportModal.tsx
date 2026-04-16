'use client'

import { useMemo, useState } from 'react'
import { getEffectiveHouseholdTriageFromHazards, isHouseholdInAnyHazardZone } from '@/lib/geo'
import { TRIAGE_ORDER } from '@/lib/triage'
import type { Asset, FloodZone, HazardEvent, Household, TriageLevel, TriageResult } from '@/types'

interface Props {
  households: Household[]
  assets: Asset[]
  activeHazard: HazardEvent | null
  activeHazards: HazardEvent[]
  floodZones: FloodZone[]
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

const TRIAGE_DISPLAY: Record<TriageLevel, TriageResult> = {
  CRITICAL: { level: 'CRITICAL', hex: '#ff4d4d', colorName: 'red' },
  HIGH: { level: 'HIGH', hex: '#f39c12', colorName: 'orange' },
  ELEVATED: { level: 'ELEVATED', hex: '#f1c40f', colorName: 'yellow' },
  STABLE: { level: 'STABLE', hex: '#58a6ff', colorName: 'blue' },
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

const filterSelectStyle: React.CSSProperties = {
  background: '#111827',
  border: '1px solid #1f2937',
  color: '#f0f6fc',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: '0.75rem',
  outline: 'none',
  cursor: 'pointer',
  minWidth: 140,
}

export default function SummaryReportModal({ households, assets, activeHazard, activeHazards, floodZones }: Props) {
  const now = new Date().toISOString()
 
  // 1. Base Affected Households Logic
  const reportHouseholds = useMemo(() => {
    if (activeHazards.length === 0) return households

    return households
      .filter((household) => isHouseholdInAnyHazardZone(household, activeHazards, floodZones))
      .map((household) => {
        const effectiveLevel = getEffectiveHouseholdTriageFromHazards(household, activeHazards, floodZones)
        return {
          ...household,
          triage: TRIAGE_DISPLAY[effectiveLevel],
        }
      })
  }, [households, activeHazards, floodZones])

  // 2. Filter States
  const [filterTriage, setFilterTriage] = useState<string>('All')
  const [filterCity, setFilterCity] = useState<string>('All')
  const [filterStatus, setFilterStatus] = useState<string>('All')
  const [filterSource, setFilterSource] = useState<string>('All')

  const cities = useMemo(() =>
    ['All', ...Array.from(new Set(reportHouseholds.map(h => h.city)))].sort(),
    [reportHouseholds]
  )
  const sources = useMemo(() =>
    ['All', ...Array.from(new Set(reportHouseholds.map(h => h.source).filter(Boolean) as string[]))].sort(),
    [reportHouseholds]
  )

  const isFiltering = filterTriage !== 'All' || filterCity !== 'All' || filterStatus !== 'All' || filterSource !== 'All'

  // 3. Filter Logic
  const filteredHouseholds = useMemo(() => {
    return reportHouseholds.filter((hh) => {
      const matchTriage = filterTriage === 'All' || hh.triage.level === filterTriage || (filterTriage === 'RESCUED' && hh.status === 'Rescued')
      const matchCity = filterCity === 'All' || hh.city === filterCity
      const matchStatus = filterStatus === 'All' || hh.status === filterStatus
      const matchSource = filterSource === 'All' || hh.source === filterSource
      return matchTriage && matchCity && matchStatus && matchSource
    })
  }, [reportHouseholds, filterTriage, filterCity, filterStatus, filterSource])

  // 4. Summary Metrics (Always based on full affected set)
  const pending = reportHouseholds.filter((h) => h.status === 'Pending')
  const rescuedCount = reportHouseholds.filter((h) => h.status === 'Rescued').length
  const counts = {
    CRITICAL: pending.filter((h) => h.triage.level === 'CRITICAL').length,
    HIGH: pending.filter((h) => h.triage.level === 'HIGH').length,
    ELEVATED: pending.filter((h) => h.triage.level === 'ELEVATED').length,
    STABLE: pending.filter((h) => h.triage.level === 'STABLE').length,
  }
 
  const incidentLabel = activeHazards.length > 0
    ? activeHazards.map((hazard) => (hazard.type === 'Volcano' ? 'Volcano Eruption' : hazard.type)).join(', ')
    : null

  const handleClearFilters = () => {
    setFilterTriage('All')
    setFilterCity('All')
    setFilterStatus('All')
    setFilterSource('All')
  }

  const getActiveBorder = (val: string) => ({
    borderColor: val !== 'All' ? 'var(--accent-blue)' : '#1f2937'
  })

  const allSorted = [...filteredHouseholds].sort(
    (a, b) => TRIAGE_ORDER[a.triage.level] - TRIAGE_ORDER[b.triage.level],
  )

  const handlePrint = () => window.print()

  const handleCopy = () => {
    const lines = [
      'L.I.G.T.A.S. INCIDENT SUMMARY REPORT',
      `Generated: ${fmt(now)}`,
      incidentLabel ? `Latest Incident: ${incidentLabel}` : 'Latest Incident: None',
      '',
      `CRITICAL: ${counts.CRITICAL}  HIGH: ${counts.HIGH}  ELEVATED: ${counts.ELEVATED}  STABLE: ${counts.STABLE}`,
      `RESCUED: ${rescuedCount}  PENDING: ${pending.length}  TOTAL: ${reportHouseholds.length}`,
      '',
      `=== ${incidentLabel ? `${incidentLabel.toUpperCase()} AFFECTED` : 'ALL HOUSEHOLDS'} ===`,
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
          <div style={{ fontSize: '0.74rem', color: activeHazard?.isActive ? 'var(--critical-red)' : 'var(--fg-muted)', marginTop: 8, fontWeight: 700 }}>
            {incidentLabel ? `Latest Incident: ${incidentLabel}` : 'Latest Incident: None'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--fg-muted)', marginTop: 4 }}>
            {incidentLabel
              ? `This summary only includes households inside the active ${incidentLabel.toLowerCase()} hazard layer.`
              : 'This summary includes all registered households because there is no active hazard layer.'}
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
          { label: 'RESCUED', value: rescuedCount, color: '#2da44e' },
          { label: 'TOTAL', value: reportHouseholds.length, color: 'var(--fg-strong)' },
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

      {/* --- FILTER BAR --- */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: '#111827',
        border: '1px solid #1f2937',
        borderRadius: 12,
        marginBottom: 20,
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.6rem', color: 'var(--fg-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Triage</label>
          <select
            value={filterTriage}
            onChange={(e) => setFilterTriage(e.target.value)}
            style={{ ...filterSelectStyle, ...getActiveBorder(filterTriage) }}
          >
            <option value="All">All Levels</option>
            <option value="CRITICAL">🔴 Critical</option>
            <option value="HIGH">🟠 High</option>
            <option value="ELEVATED">🟡 Elevated</option>
            <option value="STABLE">🔵 Stable</option>
            <option value="RESCUED">🟢 Rescued</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.6rem', color: 'var(--fg-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Location</label>
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            style={{ ...filterSelectStyle, ...getActiveBorder(filterCity) }}
          >
            {cities.map(c => <option key={c} value={c}>{c === 'All' ? 'All Cities' : c}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.6rem', color: 'var(--fg-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ ...filterSelectStyle, ...getActiveBorder(filterStatus) }}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Rescued">Rescued</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.6rem', color: 'var(--fg-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Source</label>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            style={{ ...filterSelectStyle, ...getActiveBorder(filterSource) }}
          >
            {sources.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sources' : s}</option>)}
          </select>
        </div>

        {isFiltering && (
          <button
            onClick={handleClearFilters}
            style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }}
          >
            ✕ Clear Filters
          </button>
        )}
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', borderLeft: '3px solid var(--accent-solid)', paddingLeft: 10, marginBottom: 12 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-strong)', textTransform: 'uppercase', letterSpacing: 1 }}>
            {incidentLabel ? `${incidentLabel} Affected Households (${allSorted.length})` : `All Households (${allSorted.length})`}
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
                    {incidentLabel
                      ? `No households are currently inside the active ${incidentLabel.toLowerCase()} hazard layer.`
                      : 'No households registered yet.'}
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
                const assignedHouseholds = reportHouseholds.filter((hh) => hh.assignedAssetId === asset.id)
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
                    <td style={{ ...tdStyle, color: 'var(--fg-muted)', fontSize: '0.78rem' }}>{asset.contact}</td>
                    <td style={tdStyle}>
                      <span style={{ ...statusBadgeStyle('Pending'), ...assetStatusBadgeStyle(asset.status) }}>{asset.status}</span>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--fg-muted)', fontSize: '0.78rem' }}>
                      {assignedHouseholds.length > 0 ? `${assignedHouseholds.length} household${assignedHouseholds.length > 1 ? 's' : ''}` : '-'}
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