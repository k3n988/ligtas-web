'use client'
// src/components/map/HouseholdMarker.tsx

import { useState } from 'react'
import { AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps'
import type { Household } from '@/types'
import { useHouseholdStore } from '@/store/householdStore'

interface Props {
  household: Household
}

export default function HouseholdMarker({ household: hh }: Props) {
  const markRescued = useHouseholdStore((s) => s.markRescued)
  const [open, setOpen] = useState(false)

  const color = hh.status === 'Rescued' ? '#238636' : hh.triage.hex
  const pos = { lat: hh.lat, lng: hh.lng }

  return (
    <>
      <AdvancedMarker position={pos} onClick={() => setOpen(true)} title={hh.head}>
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: color,
            border: '2.5px solid #fff',
            boxShadow: `0 0 0 2px ${color}55, 0 2px 6px rgba(0,0,0,.7)`,
            cursor: 'pointer',
          }}
        />
      </AdvancedMarker>

      {open && (
        <InfoWindow position={pos} onCloseClick={() => setOpen(false)}>
          <div
            style={{
              minWidth: 210,
              fontFamily: 'Inter, sans-serif',
              background: '#161b22',
              color: '#c9d1d9',
              padding: 2,
            }}
          >
            <div
              style={{
                color,
                fontWeight: 'bold',
                fontSize: '1.05rem',
                borderBottom: '1px solid #30363d',
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
              <em style={{ color: '#8b949e' }}>{hh.notes || 'None'}</em>
            </div>
            <div style={{ marginBottom: 10 }}>
              {hh.vulnArr.map((v) => (
                <span
                  key={v}
                  style={{
                    display: 'inline-block',
                    background: '#21262d',
                    border: '1px solid #30363d',
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
                onClick={() => {
                  markRescued(hh.id)
                  setOpen(false)
                }}
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
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                MARK AS RESCUED
              </button>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  )
}
