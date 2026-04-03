'use client'
// src/components/map/HouseholdMarker.tsx

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
  const markRescued    = useHouseholdStore((s) => s.markRescued)
  const restorePending = useHouseholdStore((s) => s.restorePending)
  const setSelectedId = useHouseholdStore((s) => s.setSelectedId)
  const selectedId = useHouseholdStore((s) => s.selectedId)
  const assets = useAssetStore((s) => s.assets)

  const color = hh.status === 'Rescued' ? '#238636' : hh.triage.hex
  const pos = { lat: hh.lat, lng: hh.lng }
  const isOpen = selectedId === hh.id

  const handleOpen = () => {
    setSelectedId(hh.id)// triggers RouteOverlay in MapView
  }

  const handleClose = () => {
    setSelectedId(null)// clears the route and closes InfoWindow
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

      {isOpen && (
        <InfoWindow 
          position={pos} 
          onCloseClick={handleClose} 
          headerDisabled={true}
          // Use a class or style to target the internal Google Maps padding
          // Note: .gm-style-iw-d is the content wrapper inside the bubble
        >
          <style>{`
            .gm-style-iw-c { padding: 0 !important; overflow: hidden !important; background: #161b22 !important; }
            .gm-style-iw-d { overflow: hidden !important; padding: 0 !important; max-height: none !important; }
            .gm-ui-hover-full { background: transparent !important; border: none !important; top: 4px !important; right: 4px !important; }
            .gm-ui-hover-full::before { background-color: #8b949e !important; }
          `}</style>
          <div
            style={{
              minWidth: 210,
              fontFamily: 'Inter, sans-serif',
              background: '#161b22',
              color: '#c9d1d9',
              padding: '12px',
              position: 'relative'
            }}
          >
            {/* Custom Close Button in case headerDisabled hides the default one */}
            <button onClick={handleClose} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            
            <div
              style={{
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
              {hh.source && (
                <>
                  <b>Source:</b>{' '}
                  <span style={{ color: '#58a6ff' }}>{hh.source}</span>
                  <br />
                </>
              )}
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
              <div style={{ display: 'flex', gap: 6 }}>
                <div
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    padding: '6px 0',
                    color: '#3fb950',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                  }}
                >
                  ✓ STATUS: RESCUED
                </div>
                <button
                  onClick={() => {
                    restorePending(hh.id)
                  }}
                  title="Undo — restore to Pending"
                  style={{
                    background: 'transparent',
                    border: '1px solid #30363d',
                    color: '#8b949e',
                    borderRadius: 4,
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  ↩
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  markRescued(hh.id)
                  handleClose()
                }}
                style={{
                  background: '#238636',
                  border: 'none',
                  color: '#ffffff',
                  width: '100%',
                  padding: '10px',
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
