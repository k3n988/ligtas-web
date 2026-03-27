'use client'
// src/components/triage/HouseholdCard.tsx

import type { Household } from '@/types'
import { useHouseholdStore } from '@/store/householdStore'
import TriageBadge from './TriageBadge'

interface Props {
  household: Household
}

const BORDER_COLOR: Record<string, string> = {
  red: 'var(--critical-red)',
  orange: 'var(--high-orange)',
  yellow: 'var(--elevated-yellow)',
  blue: 'var(--accent-blue)',
}

export default function HouseholdCard({ household: hh }: Props) {
  const markRescued = useHouseholdStore((s) => s.markRescued)
  const setPanTo = useHouseholdStore((s) => s.setPanTo)

  const isRescued = hh.status === 'Rescued'
  const borderColor = isRescued ? 'var(--resolved-green)' : BORDER_COLOR[hh.triage.colorName]

  return (
    <div
      style={{
        background: '#21262d',
        border: '1px solid var(--border-color)',
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 6,
        padding: 15,
        marginBottom: 10,
        opacity: isRescued ? 0.7 : 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 6,
        }}
      >
        <h3 style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>
          {hh.head}
        </h3>
        <TriageBadge triage={hh.triage} rescued={isRescued} />
      </div>

      <p
        style={{
          margin: '0 0 8px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}
      >
        {hh.street}, Brgy. {hh.barangay} &mdash; {hh.occupants} occupants
      </p>

      <div style={{ marginBottom: 10 }}>
        {hh.vulnArr.map((v) => (
          <span
            key={v}
            style={{
              display: 'inline-block',
              padding: '2px 6px',
              background: '#30363d',
              borderRadius: 4,
              fontSize: '0.7rem',
              marginRight: 4,
              marginBottom: 4,
              color: 'var(--text-main)',
            }}
          >
            {v}
          </span>
        ))}
      </div>

      {isRescued ? (
        <p
          style={{
            margin: 0,
            color: 'var(--resolved-green)',
            fontWeight: 'bold',
            fontSize: '0.8rem',
          }}
        >
          ✓ OPERATION COMPLETE
        </p>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setPanTo(hh.id)}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '0.75rem',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 600,
              textTransform: 'uppercase',
              background: '#30363d',
              color: '#fff',
            }}
          >
            📍 Locate
          </button>
          <button
            onClick={() => markRescued(hh.id)}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '0.75rem',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 600,
              textTransform: 'uppercase',
              background: 'transparent',
              border: '1px solid var(--resolved-green)',
              color: 'var(--resolved-green)',
            }}
          >
            ✓ Mark Rescued
          </button>
        </div>
      )}
    </div>
  )
}
