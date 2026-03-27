'use client'
// src/app/triage/TriageQueue.tsx

import { useHouseholdStore } from '@/store/householdStore'
import { TRIAGE_ORDER } from '@/lib/triage'
import HouseholdCard from '@/components/triage/HouseholdCard'

export default function TriageQueue() {
  const households = useHouseholdStore((s) => s.households)

  const sorted = [...households].sort((a, b) => {
    if (a.status === 'Rescued' && b.status !== 'Rescued') return 1
    if (a.status !== 'Rescued' && b.status === 'Rescued') return -1
    return TRIAGE_ORDER[a.triage.level] - TRIAGE_ORDER[b.triage.level]
  })

  const pending = sorted.filter((h) => h.status === 'Pending')
  const rescued = sorted.filter((h) => h.status === 'Rescued')

  if (sorted.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
        }}
      >
        No active reports in queue.
      </div>
    )
  }

  return (
    <div>
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
          Active Queue
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
    </div>
  )
}
