'use client'
// src/components/map/HazardOverlay.tsx
//
// Renders dynamic hazard-zone polygons on the Google Map with auto-resolution:
//   • Resolution State 1: polygon turns semi-transparent green when every
//     Household inside it has status === 'Rescued' (computed reactively via
//     Zustand + useMemo — no manual sync needed).
//   • Resolution State 2: clearHazard() removes the polygon + marker entirely.

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { InfoWindow, Marker, useMap } from '@vis.gl/react-google-maps'
import type { HazardArea } from '@/types'
import { useHazardStore } from '@/store/hazardStore'
import { useHouseholdStore } from '@/store/householdStore'
import { pointInPolygon, polygonCenter } from '@/lib/geo'

// ─── Visual config ────────────────────────────────────────────────────────────

const FILL: Record<HazardArea['severity'], string> = {
  Critical: '#ff4d4d',
  High:     '#f39c12',
  Elevated: '#f1c40f',
}

const STROKE: Record<HazardArea['severity'], string> = {
  Critical: '#cc0000',
  High:     '#c07800',
  Elevated: '#c09400',
}

const EMOJI: Record<HazardArea['disasterType'], string> = {
  Flood:      '🌊',
  Fire:       '🔥',
  Landslide:  '⛰️',
  Storm:      '🌀',
  Earthquake: '📳',
}

/** SVG circle with a disaster-type emoji — matches the emojiIcon pattern used
 *  across the rest of the codebase (no Advanced Marker / mapId required). */
function hazardCenterIcon(emoji: string, bg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44">
    <circle cx="22" cy="22" r="20" fill="${bg}" stroke="white" stroke-width="2.5"/>
    <text x="22" y="30" text-anchor="middle" font-size="22"
      font-family="Apple Color Emoji,Segoe UI Emoji,NotoColorEmoji,sans-serif">${emoji}</text>
  </svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

// ─── Imperative polygon renderer ──────────────────────────────────────────────
// Uses a ref to hold the google.maps.Polygon so it is created once and only
// its options are patched when allRescued flips — no flicker on state changes.

interface HazardPolygonProps {
  hazard: HazardArea
  allRescued: boolean
  onClick: () => void
}

function HazardPolygon({ hazard, allRescued, onClick }: HazardPolygonProps) {
  const map = useMap()
  const polyRef    = useRef<google.maps.Polygon | null>(null)
  const onClickRef = useRef(onClick)
  onClickRef.current = onClick

  // Create the google.maps.Polygon once per hazard id.
  useEffect(() => {
    if (!map) return

    const poly = new google.maps.Polygon({
      paths:        hazard.polygon,
      fillColor:    FILL[hazard.severity],
      fillOpacity:  0.45,
      strokeColor:  STROKE[hazard.severity],
      strokeWeight: 2.5,
      zIndex:       1,
      map,
    })
    polyRef.current = poly

    const listener = poly.addListener('click', () => onClickRef.current())

    return () => {
      google.maps.event.removeListener(listener)
      poly.setMap(null)
      polyRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, hazard.id])

  // Resolution State 1: patch fill/stroke without rebuilding the polygon.
  useEffect(() => {
    polyRef.current?.setOptions({
      fillColor:   allRescued ? '#238636' : FILL[hazard.severity],
      fillOpacity: allRescued ? 0.25      : 0.45,
      strokeColor: allRescued ? '#238636' : STROKE[hazard.severity],
    })
  }, [allRescued, hazard.severity])

  return null
}

// ─── Main overlay ─────────────────────────────────────────────────────────────

export default function HazardOverlay() {
  const hazards     = useHazardStore((s) => s.hazards)
  const clearHazard = useHazardStore((s) => s.clearHazard)
  const households  = useHouseholdStore((s) => s.households)

  const [activeId, setActiveId] = useState<string | null>(null)

  // Compute rescue status for every hazard reactively.
  // Re-runs automatically whenever households or hazards change,
  // which is triggered by householdStore.markRescued() — no manual wiring needed.
  const rescueStatus = useMemo(
    () =>
      Object.fromEntries(
        hazards.map((h) => {
          const inside       = households.filter((hh) =>
            pointInPolygon({ lat: hh.lat, lng: hh.lng }, h.polygon),
          )
          const rescuedCount = inside.filter((hh) => hh.status === 'Rescued').length
          const allRescued   = inside.length > 0 && rescuedCount === inside.length
          return [h.id, { allRescued, inside, rescuedCount }]
        }),
      ),
    [hazards, households],
  )

  const handleClear = useCallback(
    (id: string) => {
      clearHazard(id)
      setActiveId(null)
    },
    [clearHazard],
  )

  const activeHazard = hazards.find((h) => h.id === activeId) ?? null

  return (
    <>
      {hazards.map((hazard) => {
        const center     = polygonCenter(hazard.polygon)
        const { allRescued } = rescueStatus[hazard.id] ?? { allRescued: false }
        const bgColor    = allRescued ? '#238636' : FILL[hazard.severity]

        return (
          <Fragment key={hazard.id}>
            {/* Polygon drawn via the imperative Google Maps JS API */}
            <HazardPolygon
              hazard={hazard}
              allRescued={allRescued}
              onClick={() => setActiveId(hazard.id)}
            />

            {/* Disaster-type emoji marker at the polygon centroid */}
            <Marker
              position={center}
              icon={hazardCenterIcon(EMOJI[hazard.disasterType], bgColor)}
              title={`${hazard.label} — ${hazard.severity}`}
              zIndex={2}
              onClick={() => setActiveId(hazard.id)}
            />
          </Fragment>
        )
      })}

      {/* InfoWindow shown when a polygon or its center marker is clicked */}
      {activeHazard && (() => {
        const center = polygonCenter(activeHazard.polygon)
        const { allRescued, inside, rescuedCount } =
          rescueStatus[activeHazard.id] ?? { allRescued: false, inside: [], rescuedCount: 0 }
        const total = inside.length

        return (
          <InfoWindow position={center} onCloseClick={() => setActiveId(null)}>
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                minWidth: 225,
                background: '#161b22',
                color: '#c9d1d9',
                padding: 4,
              }}
            >
              {/* Header */}
              <div
                style={{
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  color: '#fff',
                  borderBottom: '1px solid #30363d',
                  paddingBottom: 6,
                  marginBottom: 6,
                }}
              >
                {EMOJI[activeHazard.disasterType]} {activeHazard.label}
              </div>

              <div style={{ fontSize: '0.75rem', color: '#8b949e', marginBottom: 10 }}>
                {activeHazard.disasterType} ·{' '}
                <span style={{ color: FILL[activeHazard.severity], fontWeight: 700 }}>
                  {activeHazard.severity}
                </span>
              </div>

              {/* Rescue progress */}
              <div
                style={{
                  padding: '8px 10px',
                  background: '#0d1117',
                  borderRadius: 4,
                  marginBottom: 12,
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ marginBottom: 6 }}>
                  Citizens in zone:{' '}
                  <strong style={{ color: '#fff' }}>
                    {rescuedCount} / {total} rescued
                  </strong>
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    height: 6,
                    background: '#30363d',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${total ? (rescuedCount / total) * 100 : 0}%`,
                      background: allRescued ? '#238636' : '#58a6ff',
                      borderRadius: 3,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>

                {allRescued && (
                  <div
                    style={{
                      marginTop: 6,
                      color: '#238636',
                      fontWeight: 700,
                      fontSize: '0.73rem',
                    }}
                  >
                    ✓ All citizens rescued — zone ready to clear
                  </div>
                )}
              </div>

              {/* Resolution State 2: clearHazardArea() */}
              <button
                onClick={() => handleClear(activeHazard.id)}
                disabled={!allRescued}
                title={
                  allRescued
                    ? 'Remove hazard zone from map (hazard physically cleared)'
                    : 'All citizens must be rescued before clearing'
                }
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'transparent',
                  border: `1px solid ${allRescued ? '#238636' : '#30363d'}`,
                  color: allRescued ? '#238636' : '#6e7681',
                  borderRadius: 4,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: allRescued ? 'pointer' : 'not-allowed',
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: 0.3,
                }}
              >
                {allRescued
                  ? '✓ Clear Hazard Area (Hazard Receded)'
                  : '🔒 Clear Hazard Area'}
              </button>

              {!allRescued && total > 0 && (
                <div style={{ marginTop: 6, fontSize: '0.7rem', color: '#f85149' }}>
                  {total - rescuedCount} citizen(s) still awaiting rescue.
                </div>
              )}
            </div>
          </InfoWindow>
        )
      })()}
    </>
  )
}
