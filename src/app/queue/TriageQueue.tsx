'use client'
// src/app/queue/TriageQueue.tsx

import { useMemo, useState } from 'react'
import { useHouseholdStore } from '@/store/householdStore'
import { TRIAGE_ORDER } from '@/lib/triage'
import HouseholdCard from '@/components/triage/HouseholdCard'

const selectStyle: React.CSSProperties = {
  background: '#0d1117',
  border: '1px solid #30363d',
  borderRadius: 4,
  padding: '6px 10px',
  fontSize: '0.78rem',
  fontFamily: 'Inter, sans-serif',
  cursor: 'pointer',
  flex: 1,
  minWidth: 0,
}

export default function TriageQueue() {
  const households = useHouseholdStore((s) => s.households)
  const setSelectedId = useHouseholdStore((s) => s.setSelectedId)

  const [cityFilter, setCityFilter] = useState('')
  const [brgyFilter, setBrgyFilter] = useState('')
  const [vulnerabilityFilter, setVulnerabilityFilter] = useState('')

  // Unique city list derived from current data
  const cities = useMemo(
    () => Array.from(new Set(households.map((h) => h.city))).filter(c => c.toLowerCase().endsWith('city')).sort((a, b) => a.localeCompare(b)),
    [households],
  )

  // Barangay list scoped to the selected city (or all if no city selected)
  const barangays = useMemo(() => {
    const source = (cityFilter)
      ? households.filter((h) => h.city === cityFilter && h.city.toLowerCase().includes('city'))
      : households.filter((h) => h.city.toLowerCase().includes('city'))
    return Array.from(new Set(source.map((h) => h.barangay))).sort((a, b) => a.localeCompare(b))
  }, [households, cityFilter])

  const handleCityChange = (v: string) => {
    setCityFilter(v)
    setBrgyFilter('') // reset barangay when city changes
  }

  const sortedHouseholds = useMemo(() => {
    const filtered = households
      .filter((h) => h.approvalStatus === 'approved')
      .filter((h) => (!cityFilter || h.city === cityFilter) && h.city.toLowerCase().endsWith('city'))
      .filter((h) => !brgyFilter || h.barangay === brgyFilter)
      .filter((h) => !vulnerabilityFilter || h.triage.level === vulnerabilityFilter);

    return filtered.sort((a, b) => {
      // 1. Rescued always at the bottom
      if (a.status === 'Rescued' && b.status !== 'Rescued') return 1
      if (a.status !== 'Rescued' && b.status === 'Rescued') return -1
      // 2. Sort by Triage Priority (Critical first) using TRIAGE_ORDER
      return TRIAGE_ORDER[a.triage.level] - TRIAGE_ORDER[b.triage.level]
    })
  }, [households, cityFilter, brgyFilter, vulnerabilityFilter])

  const pending = sortedHouseholds.filter((h) => h.status === 'Pending')
  const rescued = sortedHouseholds.filter((h) => h.status === 'Rescued')

  const isFiltered = Boolean(cityFilter || brgyFilter || vulnerabilityFilter)

  return (
    <div>
      {/* Filter bar */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: '0.7rem',
            color: '#8b949e',
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 6,
          }}
        >
          Filter
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={cityFilter}
            onChange={(e) => handleCityChange(e.target.value)}
            style={{ ...selectStyle, color: cityFilter ? '#c9d1d9' : '#8b949e' }}
          >
            <option value="" disabled hidden>
              Select City
            </option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={brgyFilter}
            onChange={(e) => setBrgyFilter(e.target.value)}
            style={{ ...selectStyle, color: brgyFilter ? '#c9d1d9' : '#8b949e' }}
          >
            <option value="" disabled hidden>
              Select Barangay
            </option>
            {barangays.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select
            value={vulnerabilityFilter}
            onChange={(e) => setVulnerabilityFilter(e.target.value)}
            style={{ ...selectStyle, color: vulnerabilityFilter ? '#c9d1d9' : '#8b949e' }}
          >
            <option value="" disabled hidden>
              Select Priority
            </option>
            {Object.keys(TRIAGE_ORDER).map((level) => (
              <option key={level} value={level}>
                {level.charAt(0) + level.slice(1).toLowerCase()}
              </option>
            ))}
          </select>

          {isFiltered && (
            <button
              onClick={() => { setCityFilter(''); setBrgyFilter(''); setVulnerabilityFilter('') }}
              title="Clear filters"
              style={{
                background: '#0d1117',
                border: '1px solid #30363d',
                color: '#8b949e',
                borderRadius: 4,
                padding: '0 10px',
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <XIcon size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          {isFiltered ? (
            <>
              {cityFilter || 'All Cities'}
              {brgyFilter ? ` · ${brgyFilter}` : ''}
            </>
          ) : (
            'Active Queue'
          )}
        </h2>
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--critical-red)',
            fontWeight: 700,
          }}
        >
          {pending.length} pending
        </span>
      </div>

      {sortedHouseholds.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#0d1117',
            border: '1px dashed #30363d',
            borderRadius: 8,
            color: '#8b949e',
          }}
        >
          <SearchIcon size={32} />
          <p style={{ margin: '12px 0 0', fontSize: '0.85rem', fontWeight: 500 }}>
            No reports match this filter.
          </p>
        </div>
      ) : (
        <>
          {/* Grouped Pending Sections */}
          {Object.keys(TRIAGE_ORDER).map((level) => {
            const group = pending.filter((h) => h.triage.level === level)
            if (group.length === 0) return null

            return (
              <div key={level} style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    color: group[0].triage.hex,
                    textTransform: 'uppercase',
                    letterSpacing: 1.2,
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                <span>{level.charAt(0) + level.slice(1).toLowerCase()} Priority</span>
                  <div style={{ flex: 1, height: 1, background: '#30363d', opacity: 0.5 }} />
                </div>
                {group.map((hh) => (
                  <div key={hh.id} onClick={() => setSelectedId(hh.id)}>
                    <HouseholdCard household={hh} />
                  </div>
                ))}
              </div>
            )
          })}

          {rescued.length > 0 && (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  margin: '24px 0 16px',
                  fontSize: '0.65rem',
                  color: '#8b949e',
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  fontWeight: 700
                }}
              >
                <span style={{ flexShrink: 0 }}>Completed Operations</span>
                <div style={{ flex: 1, height: 1, background: '#30363d' }} />
              </div>
              {rescued.map((hh) => (
                <div key={hh.id} onClick={() => setSelectedId(hh.id)}>
                  <HouseholdCard household={hh} />
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}

function XIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function SearchIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
