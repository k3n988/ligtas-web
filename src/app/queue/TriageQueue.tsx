'use client'

import { useMemo, useState } from 'react'
import { useHouseholdStore } from '@/store/householdStore'
import { useHazardStore } from '@/store/hazardStore'
import { TRIAGE_ORDER } from '@/lib/triage'
import {
  getEffectiveHouseholdTriage,
  getHouseholdHazardDistanceKm,
  isHouseholdInHazardZone,
} from '@/lib/geo'
import HouseholdCard from '@/components/triage/HouseholdCard'
import type { Household, TriageLevel, TriageResult } from '@/types'

const selectStyle: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  padding: '6px 10px',
  fontSize: '0.78rem',
  cursor: 'pointer',
  flex: 1,
  minWidth: 0,
  color: 'var(--fg-default)',
}

const TRIAGE_DISPLAY: Record<TriageLevel, TriageResult> = {
  CRITICAL: { level: 'CRITICAL', hex: '#ff4d4d', colorName: 'red' },
  HIGH: { level: 'HIGH', hex: '#f39c12', colorName: 'orange' },
  ELEVATED: { level: 'ELEVATED', hex: '#f1c40f', colorName: 'yellow' },
  STABLE: { level: 'STABLE', hex: '#58a6ff', colorName: 'blue' },
}

interface QueueEntry {
  household: Household
  effectiveLevel: TriageLevel
  isInHazardZone: boolean
  hazardDistanceKm: number | null
}

export default function TriageQueue() {
  const households = useHouseholdStore((s) => s.households)
  const setSelectedId = useHouseholdStore((s) => s.setSelectedId)
  const activeHazard = useHazardStore((s) => s.activeHazard)
  const floodZones = useHazardStore((s) => s.floodZones)

  const [cityFilter, setCityFilter] = useState('')
  const [brgyFilter, setBrgyFilter] = useState('')
  const [vulnerabilityFilter, setVulnerabilityFilter] = useState('')

  const cities = useMemo(
    () =>
      Array.from(new Set(households.map((h) => h.city)))
        .filter((c) => c.toLowerCase().endsWith('city'))
        .sort((a, b) => a.localeCompare(b)),
    [households],
  )

  const barangays = useMemo(() => {
    const source = cityFilter
      ? households.filter((h) => h.city === cityFilter && h.city.toLowerCase().includes('city'))
      : households.filter((h) => h.city.toLowerCase().includes('city'))
    return Array.from(new Set(source.map((h) => h.barangay))).sort((a, b) => a.localeCompare(b))
  }, [households, cityFilter])

  const handleCityChange = (v: string) => {
    setCityFilter(v)
    setBrgyFilter('')
  }

  const queueEntries = useMemo<QueueEntry[]>(() => {
    const filtered = households
      .filter((h) => h.approvalStatus === 'approved')
      .filter((h) => (!cityFilter || h.city === cityFilter) && h.city.toLowerCase().endsWith('city'))
      .filter((h) => !brgyFilter || h.barangay === brgyFilter)
      .map((household) => {
        const effectiveLevel = getEffectiveHouseholdTriage(household, activeHazard, floodZones)
        const isInHazardZone = isHouseholdInHazardZone(household, activeHazard, floodZones)
        return {
          household: {
            ...household,
            triage: TRIAGE_DISPLAY[effectiveLevel],
          },
          effectiveLevel,
          isInHazardZone,
          hazardDistanceKm: getHouseholdHazardDistanceKm(household, activeHazard),
        }
      })
      .filter((entry) => !vulnerabilityFilter || entry.effectiveLevel === vulnerabilityFilter)

    return filtered.sort((a, b) => {
      if (a.household.status === 'Rescued' && b.household.status !== 'Rescued') return 1
      if (a.household.status !== 'Rescued' && b.household.status === 'Rescued') return -1

      if (activeHazard?.isActive && a.isInHazardZone !== b.isInHazardZone) {
        return a.isInHazardZone ? -1 : 1
      }

      const triageDiff = TRIAGE_ORDER[a.effectiveLevel] - TRIAGE_ORDER[b.effectiveLevel]
      if (triageDiff !== 0) return triageDiff

      if (a.isInHazardZone && b.isInHazardZone) {
        const distanceA = a.hazardDistanceKm ?? Number.MAX_SAFE_INTEGER
        const distanceB = b.hazardDistanceKm ?? Number.MAX_SAFE_INTEGER
        if (distanceA !== distanceB) return distanceA - distanceB
      }

      return a.household.city.localeCompare(b.household.city) || a.household.barangay.localeCompare(b.household.barangay)
    })
  }, [households, cityFilter, brgyFilter, vulnerabilityFilter, activeHazard, floodZones])

  const pending = queueEntries.filter((entry) => entry.household.status === 'Pending')
  const rescued = queueEntries.filter((entry) => entry.household.status === 'Rescued')
  const hazardPending = pending.filter((entry) => entry.isInHazardZone)
  const regularPending = pending.filter((entry) => !entry.isInHazardZone)
  const isFiltered = Boolean(cityFilter || brgyFilter || vulnerabilityFilter)
  const showHazardPriority = Boolean(activeHazard?.isActive && hazardPending.length > 0)

  const renderPriorityGroups = (entries: QueueEntry[]) =>
    Object.keys(TRIAGE_ORDER).map((level) => {
      const group = entries.filter((entry) => entry.effectiveLevel === level)
      if (group.length === 0) return null

      return (
        <div key={level} style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              color: group[0].household.triage.hex,
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>{level.charAt(0) + level.slice(1).toLowerCase()} Priority</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)', opacity: 0.5 }} />
          </div>
          {group.map(({ household }) => (
            <div key={household.id} onClick={() => setSelectedId(household.id)}>
              <HouseholdCard household={household} />
            </div>
          ))}
        </div>
      )
    })

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: '0.7rem',
            color: 'var(--fg-muted)',
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 6,
          }}
        >
          Filter
        </div>
        <div className="mobile-stack" style={{ display: 'flex', gap: 8 }}>
          <select
            value={cityFilter}
            onChange={(e) => handleCityChange(e.target.value)}
            aria-label="Filter queue by city"
            style={{ ...selectStyle, color: cityFilter ? 'var(--fg-default)' : 'var(--fg-muted)' }}
          >
            <option value="" disabled hidden>
              Select City
            </option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={brgyFilter}
            onChange={(e) => setBrgyFilter(e.target.value)}
            aria-label="Filter queue by barangay"
            style={{ ...selectStyle, color: brgyFilter ? 'var(--fg-default)' : 'var(--fg-muted)' }}
          >
            <option value="" disabled hidden>
              Select Barangay
            </option>
            {barangays.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            value={vulnerabilityFilter}
            onChange={(e) => setVulnerabilityFilter(e.target.value)}
            aria-label="Filter queue by priority"
            style={{ ...selectStyle, color: vulnerabilityFilter ? 'var(--fg-default)' : 'var(--fg-muted)' }}
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
              onClick={() => {
                setCityFilter('')
                setBrgyFilter('')
                setVulnerabilityFilter('')
              }}
              title="Clear filters"
              aria-label="Clear queue filters"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--fg-muted)',
                borderRadius: 4,
                padding: '0 10px',
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <XIcon size={14} />
            </button>
          )}
        </div>
      </div>

      <div
        className="mobile-stack"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          gap: 8,
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

      {showHazardPriority && (
        <div
          style={{
            marginBottom: 14,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--critical-red)',
            background: 'var(--bg-danger-subtle)',
            color: 'var(--fg-default)',
          }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.1, color: 'var(--critical-red)' }}>
            {activeHazard?.type} Hazard Priority Active
          </div>
          <div style={{ marginTop: 4, fontSize: '0.78rem', color: 'var(--fg-muted)' }}>
            {hazardPending.length} household{hazardPending.length !== 1 ? 's' : ''} inside the active hazard layer are pinned to the top of the queue.
          </div>
        </div>
      )}

      {queueEntries.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--bg-surface)',
            border: '1px dashed var(--border)',
            borderRadius: 8,
            color: 'var(--fg-muted)',
          }}
        >
          <SearchIcon size={32} />
          <p style={{ margin: '12px 0 0', fontSize: '0.85rem', fontWeight: 500 }}>
            No reports match this filter.
          </p>
        </div>
      ) : (
        <>
          {showHazardPriority ? (
            <>
              <div
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--critical-red)',
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  fontWeight: 800,
                  marginBottom: 12,
                }}
              >
                Inside Active Hazard Layer
              </div>
              {renderPriorityGroups(hazardPending)}

              {regularPending.length > 0 && (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      margin: '24px 0 16px',
                      fontSize: '0.65rem',
                      color: 'var(--fg-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: 1.5,
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>Outside Active Hazard Layer</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  </div>
                  {renderPriorityGroups(regularPending)}
                </>
              )}
            </>
          ) : (
            renderPriorityGroups(pending)
          )}

          {rescued.length > 0 && (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  margin: '24px 0 16px',
                  fontSize: '0.65rem',
                  color: 'var(--fg-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  fontWeight: 700,
                }}
              >
                <span style={{ flexShrink: 0 }}>Completed Operations</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
              {rescued.map(({ household }) => (
                <div key={household.id} onClick={() => setSelectedId(household.id)}>
                  <HouseholdCard household={household} />
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
