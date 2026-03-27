'use client'
// src/components/map/HouseholdMarker.tsx

import { CircleMarker, Popup } from 'react-leaflet'
import type { Household } from '@/types'
import { useHouseholdStore } from '@/store/householdStore'

interface Props {
  household: Household
}

export default function HouseholdMarker({ household: hh }: Props) {
  const markRescued = useHouseholdStore((s) => s.markRescued)
  const color = hh.status === 'Rescued' ? '#238636' : hh.triage.hex

  return (
    <CircleMarker
      center={[hh.lat, hh.lng]}
      radius={10}
      pathOptions={{ fillColor: color, color: '#fff', weight: 2, fillOpacity: 0.9 }}
    >
      <Popup>
        <div style={{ minWidth: 210, fontFamily: 'Inter, sans-serif' }}>
          <div
            style={{
              color,
              fontWeight: 'bold',
              fontSize: '1.05rem',
              borderBottom: '1px solid #444',
              paddingBottom: 6,
              marginBottom: 8,
            }}
          >
            {hh.head}
          </div>
          <div style={{ fontSize: '0.8rem', lineHeight: 1.6, marginBottom: 10 }}>
            <b>ID:</b> {hh.id}
            <br />
            <b>Loc:</b> {hh.street}, {hh.barangay}
            <br />
            <b>Occupants:</b> {hh.occupants} &nbsp;|&nbsp; <b>Structure:</b> {hh.structure}
            <br />
            <b>Notes:</b>{' '}
            <em style={{ color: '#aaa' }}>{hh.notes || 'None'}</em>
          </div>
          <div style={{ marginBottom: 10 }}>
            {hh.vulnArr.map((v) => (
              <span
                key={v}
                style={{
                  display: 'inline-block',
                  background: '#30363d',
                  padding: '2px 5px',
                  borderRadius: 3,
                  fontSize: '0.7rem',
                  margin: 2,
                  color: '#c9d1d9',
                }}
              >
                {v}
              </span>
            ))}
          </div>
          {hh.status === 'Rescued' ? (
            <div
              style={{
                textAlign: 'center',
                padding: '6px',
                background: '#238636',
                color: '#fff',
                borderRadius: 4,
                fontWeight: 'bold',
                fontSize: '0.8rem',
              }}
            >
              STATUS: RESCUED
            </div>
          ) : (
            <button
              onClick={() => markRescued(hh.id)}
              style={{
                background: 'transparent',
                border: '1px solid #238636',
                color: '#238636',
                width: '100%',
                padding: '8px',
                cursor: 'pointer',
                borderRadius: 4,
                fontWeight: 'bold',
                fontSize: '0.8rem',
              }}
            >
              MARK AS RESCUED
            </button>
          )}
        </div>
      </Popup>
    </CircleMarker>
  )
}
