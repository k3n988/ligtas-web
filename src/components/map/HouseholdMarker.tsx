'use client'
// src/components/map/HouseholdMarker.tsx

import { useState } from 'react'
import { Marker, InfoWindow } from '@vis.gl/react-google-maps'
import type { Household } from '@/types'
import { useHouseholdStore } from '@/store/householdStore'
import { useAssetStore } from '@/store/assetStore'
import { haversineKm } from '@/lib/geo'

interface Props {
  household: Household
}

/** Renders a filled circle as an SVG data-URI icon — no mapId required. */
function circleIcon(fill: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
    <circle cx="12" cy="12" r="10" fill="${fill}" stroke="white" stroke-width="2.5"/>
  </svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export default function HouseholdMarker({ household: hh }: Props) {
  const markRescued = useHouseholdStore((s) => s.markRescued)
  const setSelectedId = useHouseholdStore((s) => s.setSelectedId)
  const assets = useAssetStore((s) => s.assets)
  const [open, setOpen] = useState(false)

  const color = hh.status === 'Rescued' ? '#238636' : hh.triage.hex
  const pos = { lat: hh.lat, lng: hh.lng }

  const handleOpen = () => {
    setOpen(true)
    setSelectedId(hh.id)   // triggers RouteOverlay in MapView
  }

  const handleClose = () => {
    setOpen(false)
    setSelectedId(null)    // clears the route
  }

  // Find nearest asset name for the info panel
  const nearest = assets.length
    ? assets.reduce((prev, curr) =>
        haversineKm(hh.lat, hh.lng, curr.lat, curr.lng) <
        haversineKm(hh.lat, hh.lng, prev.lat, prev.lng)
          ? curr : prev,
      )
    : null

  return (
    <>
      <Marker
        position={pos}
        icon={circleIcon(color)}
        title={hh.head}
        onClick={handleOpen}
      />

      {open && (
        <InfoWindow position={pos} onCloseClick={handleClose}>
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
            {nearest && hh.status !== 'Rescued' && (
              <div
                style={{
                  marginBottom: 10,
                  padding: '6px 10px',
                  background: '#0d1117',
                  borderRadius: 4,
                  border: '1px solid #30363d',
                  fontSize: '0.75rem',
                  color: '#58a6ff',
                }}
              >
                🧭 Routing from: <b>{nearest.icon} {nearest.name}</b>
                &nbsp;({(haversineKm(hh.lat, hh.lng, nearest.lat, nearest.lng) * 1000).toFixed(0)} m away)
              </div>
            )}
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
                  setSelectedId(null)
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
