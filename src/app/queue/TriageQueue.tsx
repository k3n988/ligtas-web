'use client'
// src/app/queue/TriageQueue.tsx

import { useMemo, useState } from 'react'
import { useHouseholdStore } from '@/store/householdStore'
import { TRIAGE_ORDER } from '@/lib/triage'
import HouseholdCard from '@/components/triage/HouseholdCard'

const selectStyle: React.CSSProperties = {
  background: '#0d1117',
  border: '1px solid #30363d',
  color: '#c9d1d9',
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

  const [cityFilter, setCityFilter] = useState('')
  const [brgyFilter, setBrgyFilter] = useState('')

  // Unique city list derived from current data
  const cities = useMemo(
    () => Array.from(new Set(households.map((h) => h.city))).sort(),
    [households],
  )

  // Barangay list scoped to the selected city (or all if no city selected)
  const barangays = useMemo(() => {
    const source = cityFilter
      ? households.filter((h) => h.city === cityFilter)
      : households
    return Array.from(new Set(source.map((h) => h.barangay))).sort()
  }, [households, cityFilter])

  const handleCityChange = (v: string) => {
    setCityFilter(v)
    setBrgyFilter('') // reset barangay when city changes
  }

  const filtered = useMemo(() => {
    return [...households]
      .filter((h) => !cityFilter || h.city === cityFilter)
      .filter((h) => !brgyFilter || h.barangay === brgyFilter)
      .sort((a, b) => {
        if (a.status === 'Rescued' && b.status !== 'Rescued') return 1
        if (a.status !== 'Rescued' && b.status === 'Rescued') return -1
        return TRIAGE_ORDER[a.triage.level] - TRIAGE_ORDER[b.triage.level]
      })
  }, [households, cityFilter, brgyFilter])

  const pending = filtered.filter((h) => h.status === 'Pending')
  const rescued = filtered.filter((h) => h.status === 'Rescued')

  const isFiltered = Boolean(cityFilter || brgyFilter)

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
            style={selectStyle}
          >
            <option value="">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={brgyFilter}
            onChange={(e) => setBrgyFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="">All Barangays</option>
            {barangays.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {isFiltered && (
            <button
              onClick={() => { setCityFilter(''); setBrgyFilter('') }}
              title="Clear filters"
              style={{
                background: 'transparent',
                border: '1px solid #30363d',
                color: '#8b949e',
                borderRadius: 4,
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontFamily: 'Inter, sans-serif',
                flexShrink: 0,
              }}
            >
              ✕ Clear
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

      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
          }}
        >
          No reports match this filter.
        </div>
      ) : (
        <>
          {pending.map((hh) => (
            <HouseholdCard key={hh.id} household={hh} />
          ))}

          {rescued.length > 0 && (
            <>
              <div
                style={{
                  borderTop: '1px solid var(--border-color)',
                  margin: '16px 0 12px',
                  paddingTop: 12,
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Completed Operations
              </div>
              {rescued.map((hh) => (
                <HouseholdCard key={hh.id} household={hh} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}
